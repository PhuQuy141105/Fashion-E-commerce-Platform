import csv
from django.conf import settings
from django.db.models import Q
from django.core.management.base import BaseCommand
from shop_online import stylist
from shop_online.models import Product, ProductStatus
class Command(BaseCommand):
    help = "So sánh baseline tìm kiếm từ khóa với trợ lý AI trên cùng bộ câu hỏi test"

    def handle(self, *args, **options):
        input_path = str(settings.BASE_DIR / "ai_eva" / "test_questions_ai_stylist.csv")
        output_path = str(settings.BASE_DIR / "ai_eva" / "baseline_comparison_results.csv")

        with open(input_path, encoding="utf-8-sig") as f:
            questions = list(csv.DictReader(f))

        rows = []
        for row in questions:
            query = row["cau_hoi"]
            baseline_results = self._baseline_keyword_search(query)

            criteria = stylist.extract_criteria(query)
            ai_candidates = (
                stylist.retrieve_candidate_products(criteria)
                if criteria.is_fashion_related and not criteria.needs_clarification else []
            )

            rows.append({
                "ma": row["ma"],
                "cau_hoi": query,
                "so_ket_qua_baseline_tu_khoa": len(baseline_results),
                "so_ung_vien_ai_stylist": len(ai_candidates),
                "ai_hieu_duoc_can_lam_ro": criteria.needs_clarification,
            })
            self.stdout.write(f"  Đã xử lý {row['ma']}")

        with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)

        self.stdout.write(self.style.SUCCESS(f"Đã lưu kết quả so sánh vào {output_path}"))

    def _baseline_keyword_search(self, query_text, limit=15):
        qs = Product.objects.filter(active=True, status=ProductStatus.ACTIVE)
        words = [w for w in query_text.lower().split() if len(w) > 2]
        if not words:
            return []
        q_obj = Q()
        for w in words:
            q_obj |= Q(name__icontains=w) | Q(description__icontains=w)
        return list(qs.filter(q_obj).distinct()[:limit])
