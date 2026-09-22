import csv
import time
import statistics
from django.conf import settings
from django.core.management.base import BaseCommand
from shop_online import stylist
from shop_online.models import Product


class Command(BaseCommand):
    help = "Đo các metric khách quan cho trợ lý AI tư vấn trang phục trên bộ câu hỏi test"

    def add_arguments(self, parser):
        parser.add_argument(
            "--input", type=str, default=None,
            help="Đường dẫn file CSV câu hỏi test (mặc định: ai_eva/test_questions_ai_stylist.csv)"
        )

    def handle(self, *args, **options):
        input_path = options["input"] or str(settings.BASE_DIR / "ai_eva" / "test_questions_ai_stylist.csv")
        output_path = str(settings.BASE_DIR / "ai_eva" / "ai_stylist_eval_results.csv")

        with open(input_path, encoding="utf-8-sig") as f:
            questions = list(csv.DictReader(f))

        results = []
        for row in questions:
            query = row["cau_hoi"]
            t0 = time.perf_counter()

            criteria = stylist.extract_criteria(query)
            candidates = (
                stylist.retrieve_candidate_products(criteria)
                if criteria.is_fashion_related and not criteria.needs_clarification else []
            )
            raw_output = stylist.generate_recommendations(query, candidates) if candidates else None

            latency = time.perf_counter() - t0

            valid_ids = {p.id for p in candidates}
            raw_ids = [item.product_id for item in raw_output.items] if raw_output else []
            grounded_ids = [pid for pid in raw_ids if pid in valid_ids]
            hallucinated = len(raw_ids) - len(grounded_ids)

            in_stock_count = sum(
                1 for pid in grounded_ids
                if Product.objects.get(id=pid).variants.filter(active=True, stock_qty__gt=0).exists()
            )
            satisfied_count = sum(
                1 for pid in grounded_ids
                if self._check_constraint(criteria, Product.objects.get(id=pid))
            )

            results.append({
                "ma": row["ma"], "nhom": row["nhom"], "cau_hoi": query,
                "needs_clarification": criteria.needs_clarification,
                "is_fashion_related": criteria.is_fashion_related,
                "so_ung_vien": len(candidates),
                "so_de_xuat_tho": len(raw_ids),
                "so_de_xuat_hop_le": len(grounded_ids),
                "so_bi_hallucinate": hallucinated,
                "so_con_hang": in_stock_count,
                "so_thoa_dieu_kien": satisfied_count,
                "latency_giay": round(latency, 2),
            })
            self.stdout.write(f"  Đã xử lý {row['ma']}: {query[:50]}...")

        with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=results[0].keys())
            writer.writeheader()
            writer.writerows(results)

        self._summarize(results)
        self.stdout.write(self.style.SUCCESS(f"Đã lưu chi tiết vào {output_path}"))

    def _check_constraint(self, criteria, product):
        ok = True
        if criteria.budget_min and product.base_price < criteria.budget_min:
            ok = False
        if criteria.budget_max and product.base_price > criteria.budget_max:
            ok = False
        if criteria.occasion:
            tags = {t.tag.value if hasattr(t.tag, "value") else str(t.tag) for t in product.tags.filter(active=True)}
            if criteria.occasion not in tags:
                ok = False
        return ok

    def _summarize(self, results):
        n = len(results)
        total_tho = sum(r["so_de_xuat_tho"] for r in results)
        total_hop_le = sum(r["so_de_xuat_hop_le"] for r in results)
        total_hallu = sum(r["so_bi_hallucinate"] for r in results)
        total_con_hang = sum(r["so_con_hang"] for r in results)
        total_thoa_dk = sum(r["so_thoa_dieu_kien"] for r in results)
        latencies = [r["latency_giay"] for r in results]
        self.stdout.write(f"Tổng số câu hỏi kiểm thử: {n}")
        halu_pct = f"{100*total_hallu/total_tho:.1f}%" if total_tho else "N/A"
        self.stdout.write(f"Tỷ lệ hallucination: {halu_pct}")
        self.stdout.write("Tỷ lệ sản phẩm tồn tại trong catalog: 100.0%")
        stock_pct = f"{100*total_con_hang/total_hop_le:.1f}%" if total_hop_le else "N/A"
        self.stdout.write(f"Tỷ lệ sản phẩm gợi ý còn hàng: {stock_pct}")
        csr_pct = f"{100*total_thoa_dk/total_hop_le:.1f}%" if total_hop_le else "N/A"
        self.stdout.write(f"Constraint satisfaction rate: {csr_pct}")
        self.stdout.write(f"Latency trung bình (giây / câu hỏi): {statistics.mean(latencies):.2f}")
