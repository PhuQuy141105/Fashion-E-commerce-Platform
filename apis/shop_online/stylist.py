import os
from typing import List, Optional,Literal
from pydantic import BaseModel, Field
from django.db.models import Q
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from shop_online.models import Product, ProductStatus,OccasionTag, ProductVariant
from dotenv import load_dotenv
from difflib import get_close_matches
import groq

load_dotenv()
VALID_OCCASIONS = [t.value for t in OccasionTag]
OCCASION_LIST_STR = ", ".join(VALID_OCCASIONS)
class StylistCriteria(BaseModel):
    is_fashion_related: bool = Field(
        True,
        description="False nếu nội dung khách nhập KHÔNG liên quan gì tới nhu cầu "
                    "thời trang/quần áo (ví dụ hỏi thời tiết, hỏi giá ship, chào hỏi chung chung...). "
                    "True nếu có liên quan dù chỉ một phần"
    )
    occasion: Optional[Literal["OFFICE", "PARTY", "CASUAL", "SPORT", "DATE", "WEDDING", "TRAVEL"]] = Field(
        None,
        description=f"Dịp sử dụng, chỉ được chọn đúng 1 giá trị trong: {OCCASION_LIST_STR}.Nếu không khớp rõ ràng với dịp nào trong danh sách, để null"
    )
    budget_min: Optional[int] = Field(None, description="Ngân sách tối thiểu, đơn vị VNĐ")
    budget_max: Optional[int] = Field(None, description="Ngân sách tối đa, đơn vị VNĐ")
    size: Optional[Literal["XS", "S", "M", "L", "XL", "XXL", "FREESIZE"]] = Field(
        None,
        description="Kích cỡ khách yêu cầu nếu có đề cập, chỉ chọn đúng 1 trong các giá trị hợp lệ hoặc để trống nếu không nhắc tới"
    )
    style_preference: Optional[str] = Field(None, description="Phong cách mong muốn: thanh lịch, năng động, tối giản...")
    color: Optional[str] = Field(None, description="Màu sắc ưu tiên nếu khách có đề cập, để trống nếu không có")
    needs_clarification: bool = Field(False,description="True nếu thông tin khách cung cấp quá ít để tư vấn chính xác (ví dụ chỉ 1-2 từ, không rõ ngân sách/phong cách, hoặc occasion không xác định được)")
    clarification_question: Optional[str] = Field(None,description="Câu hỏi ngắn gọn, thân thiện để hỏi lại khách khi needs_clarification=True")

def get_available_colors():
    return list(ProductVariant.objects.filter(active=True).values_list("color", flat=True).distinct())

def match_known_color(raw_color: str, known_colors: list) -> str | None:
    if not raw_color:
        return None
    raw_lower = raw_color.strip().lower()
    lower_map = {c.lower(): c for c in known_colors}
    if raw_lower in lower_map:
        return lower_map[raw_lower]
    close = get_close_matches(raw_lower, lower_map.keys(), n=1, cutoff=0.75)
    return lower_map[close[0]] if close else None

def get_llm(temperature=0):
    return ChatGroq(model="openai/gpt-oss-20b",temperature=temperature,api_key=os.getenv("GROQ_API_KEY"))

EXTRACT_PROMPT = ChatPromptTemplate.from_template(
    "Bạn là trợ lý phân tích yêu cầu mua sắm thời trang.\n"
    "Hãy đọc mô tả nhu cầu của khách hàng và trích xuất tiêu chí có cấu trúc.\n\n"
    f"Trường 'occasion' chỉ được chọn đúng 1 giá trị trong danh sách sau: {OCCASION_LIST_STR}. "
    "Hãy suy luận theo nghĩa gần thay vì chỉ khớp chính xác từ ngữ, ví dụ: 'đi chơi', "
    "'dạo phố', 'ở nhà', 'mặc hàng ngày' -> CASUAL; 'đi làm', 'công sở' -> OFFICE; "
    "'sinh nhật', 'liên hoan', 'tiệc tùng' -> PARTY; 'tập luyện', 'chạy bộ', 'gym' -> SPORT; "
    "'hẹn hò', 'gặp người yêu' -> DATE; 'đám cưới' -> WEDDING; 'du lịch', 'đi xa' -> TRAVEL. "
    "Chỉ để occasion = null khi thực sự không có bất kỳ ngữ cảnh nào liên quan tới dịp sử dụng.\n\n"
    "Trường 'size' chỉ được chọn đúng 1 giá trị trong: XS, S, M, L, XL, XXL, FREESIZE nếu khách có "
    "nhắc tới kích cỡ, để null nếu không nhắc tới.\n\n"
    "Nếu khách có nhắc tới màu sắc, chỉ nên chọn nếu khớp với 1 trong các màu đang có sau: "
    "{color_list}. Nếu không chắc khớp màu nào, để color = null.\n\n"
    "{previous_context}"  
    "Chỉ đặt needs_clarification=true khi câu mô tả chỉ có 1-2 từ chung chung không mang bất kỳ "
    "tín hiệu nào, hoàn toàn không thể suy luận được dịp sử dụng, phong cách, kích cỡ hay đối "
    "tượng nào. Nếu đã suy luận được ít nhất một tiêu chí có ý nghĩa, hãy trích xuất tiêu chí đó "
    "và đặt needs_clarification=false, không hỏi lại chỉ vì còn thiếu tiêu chí khác.\n\n"
    "Mô tả của khách hàng: {query_text}\n\n"
    "Trả lời bằng đúng một khối JSON hợp lệ, không kèm giải thích hay văn bản nào khác."
)
def extract_criteria(query_text: str, previous_criteria: dict = None) -> StylistCriteria:
    previous_context = ""
    if previous_criteria:
        known = []
        if previous_criteria.get("occasion"):
            known.append(f"Dịp sử dụng đã biết = {previous_criteria['occasion']}")
        if previous_criteria.get("budget_min") or previous_criteria.get("budget_max"):
            known.append(f"Ngân sách đã biết = {previous_criteria.get('budget_min')} đến {previous_criteria.get('budget_max')}")
        if previous_criteria.get("style_preference"):
            known.append(f"Phong cách đã biết = {previous_criteria['style_preference']}")
        if previous_criteria.get("color"):
            known.append(f"Màu sắc đã biết = {previous_criteria['color']}")
        if previous_criteria.get("size"):
            known.append(f"Kích cỡ đã biết = {previous_criteria['size']}")
        if known:
            previous_context = (
                    "Đây là tin nhắn tiếp theo trong cùng một cuộc trò chuyện, không phải yêu cầu mới "
                    "hoàn toàn. Từ (các) tin nhắn trước, đã biết: " + "; ".join(known) + ". "
                    "Hãy giữ nguyên các tiêu chí đã biết này nếu tin nhắn mới không nhắc lại hoặc không mâu thuẫn, chỉ cập nhật/ghi đè đúng phần mà tin nhắn mới đề cập.\n\n"
            )
    llm = get_llm()
    color_list_str = ", ".join(get_available_colors()) or "chưa có dữ liệu màu"
    structured_llm = llm.with_structured_output(StylistCriteria,method="json_mode")
    chain = EXTRACT_PROMPT | structured_llm
    try:
        return chain.invoke({"query_text": query_text, "color_list": color_list_str, "previous_context": previous_context,})
    except groq.BadRequestError:
        return StylistCriteria(is_fashion_related=True, needs_clarification=True,clarification_question="Bạn có thể mô tả rõ hơn nhu cầu của mình không?")

def retrieve_candidate_products(criteria: StylistCriteria, limit: int = 15):
    qs = Product.objects.filter(active=True, status=ProductStatus.ACTIVE,variants__active=True,
                                variants__stock_qty__gt=0).distinct()
    if criteria.budget_min:
        qs = qs.filter(base_price__gte=criteria.budget_min)
    if criteria.budget_max:
        qs = qs.filter(base_price__lte=criteria.budget_max)
    if criteria.occasion:
        occasion = OccasionTag(criteria.occasion)
        qs = qs.filter(tags__tag=occasion, tags__active=True)
    if criteria.size:
        qs = qs.filter(variants__size=criteria.size, variants__stock_qty__gt=0)
    if criteria.color:
        matched_color = match_known_color(criteria.color, get_available_colors())
        if matched_color:
            qs = qs.filter(variants__color=matched_color)
    qs = qs.order_by('-sold_count', '-view_count')
    return list(qs.select_related("category", "brand")[:limit])

class RecommendedItem(BaseModel):
    product_id: int = Field(description="ID sản phẩm được chọn phải lấy từ danh sách sản phẩm cung cấp")
    reason: str = Field(description="Giải thích ngắn gọn vì sao sản phẩm này phù hợp")
class RecommendationOutput(BaseModel):
    items: List[RecommendedItem] = Field(description="Danh sách sản phẩm được gợi ý, theo thứ tự ưu tiên")
GENERATE_PROMPT = ChatPromptTemplate.from_template(
    "Bạn là stylist tư vấn thời trang. Toàn bộ sản phẩm trong danh sách dưới đây đã được xác nhận "
    "trước là phù hợp với dịp của khách (đã lọc theo nhãn chính xác), nên bạn chỉ cần chọn ra những "
    "sản phẩm phối hợp hợp lý với nhau thành bộ trang phục, và giải thích ngắn gọn.\n"
    "Chỉ được chọn sản phẩm có trong danh sách, không bịa thêm.\n\n"
    "Nhu cầu của khách hàng: {query_text}\n\n"
    "Danh sách sản phẩm phù hợp:\n{product_list}\n\n"
    "Nếu danh sách rỗng, trả về items là danh sách rỗng.\n\n"
    "Trả lời bằng đúng một khối JSON theo cấu trúc sau, không thêm trường nào khác ngoài "
    "hai trường dưới đây cho mỗi phần tử:\n"
    '{{"items": [{{"product_id": <ID sản phẩm, là số nguyên lấy đúng từ danh sách trên>, '
    '"reason": "<lý do ngắn gọn vì sao sản phẩm này phù hợp>"}}]}}\n'
    "Tuyệt đối không dùng tên trường khác như id, name, brand, price, size, color trong kết quả trả về — "
    "chỉ có đúng product_id và reason."
)
def generate_recommendations(query_text: str, products: list) -> RecommendationOutput:
    if not products:
        return RecommendationOutput(items=[])
    def describe_product(p):
        variants = p.variants.filter(active=True, stock_qty__gt=0)
        sizes = sorted({str(v.size) for v in variants})
        colors = sorted({v.color for v in variants})
        occasions = [t.tag.value if hasattr(t.tag, "value") else str(t.tag) for t in p.tags.filter(active=True)]
        return (
            f"ID {p.id}: {p.name} | Thương hiệu: {p.brand.name if p.brand else 'Không rõ'} | "
            f"Đối tượng: {p.gender_target.value if hasattr(p.gender_target, 'value') else p.gender_target} | "
            f"Danh mục: {p.category.name} | Dịp sử dụng: {', '.join(occasions) or 'Không gắn nhãn'} | "
            f"Giá: {int(p.base_price):,}đ | Size còn hàng: {', '.join(sizes) or 'Hết hàng'} | "
            f"Màu còn hàng: {', '.join(colors) or 'Hết hàng'} | Mô tả: {p.description[:100]}"
        )
    product_lines = "\n".join(describe_product(p) for p in products)
    llm = get_llm()
    structured_llm = llm.with_structured_output(RecommendationOutput, method="json_mode")
    chain = GENERATE_PROMPT | structured_llm
    try:
        return chain.invoke({"query_text": query_text, "product_list": product_lines})
    except groq.BadRequestError:
        return RecommendationOutput(items=[])