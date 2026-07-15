#!/usr/bin/env python3
"""
Marketplace Review Sentiment Analyzer

Analyzes product reviews for sentiment, extracts themes,
and generates actionable insights for marketplace sellers.

Supports Indonesian and English reviews.
Zero dependencies - Python stdlib only.

Usage:
    python3 analyze.py reviews.csv
    python3 analyze.py --sample
    python3 analyze.py --interactive
"""

import csv
import sys
import os
import re
import json
import argparse
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Optional

# ANSI colors
class C:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    BG_RED = "\033[41m"
    BG_GREEN = "\033[42m"
    BG_YELLOW = "\033[43m"

# Sentiment keywords (Indonesian + English)
POSITIVE_WORDS = {
    # Indonesian
    "bagus", "baik", "puas", "suka", "recommended", "rekomen",
    "cepat", "ramah", "sesuai", "original", "asli", "mantap",
    "keren", "top", "oke", "ok", "sempurna", "sempurna", "rapi",
    "aman", "nyaman", "berkualitas", "worth", "mantul", "joss",
    "terbaik", "memuaskan", "tepat", "responsif", "sigap",
    "bersih", "wangi", "enak", "pas", "cocok", "sreg",
    "terima kasih", "makasih", "thx", "thanks", "good",
    # English
    "excellent", "great", "amazing", "perfect", "love", "best",
    "fast", "quality", "reliable", "trustworthy", "awesome",
    "fantastic", "wonderful", "superb", "outstanding", "nice",
    "happy", "satisfied", "recommend", "smooth", "easy",
}

NEGATIVE_WORDS = {
    # Indonesian
    "jelek", "rusak", "cacat", "lambat", "lama", "kecewa",
    "tipu", "penipu", "scam", "palsu", "kw", "tiruan",
    "bau", "kotor", "sobek", "pecah", "retak", "berkarat",
    "tidak sesuai", "ga sesuai", "gak sesuai", "beda",
    "parah", "buruk", "zonk", "rugi", "mengecewakan",
    "komplain", "refund", "return", "kembali", "tukar",
    "pending", "hilang", "hilang", "salah", "keliru",
    "lamban", "lemot", "error", "bug", "defect",
    # English
    "bad", "terrible", "awful", "worst", "hate", "broken",
    "damaged", "defective", "slow", "fake", "counterfeit",
    "disappointed", "waste", "trash", "garbage", "poor",
    "horrible", "disgusting", "scam", "fraud", "useless",
}

# Theme keywords
THEMES = {
    "Shipping": {
        "keywords": {
            "pengiriman", "kirim", "kurir", "ekspedisi", "jne", "jnt",
            "sicepat", "anteraja", "gosend", "grab", "instant",
            "shipping", "delivery", "courier", "package", "tracking",
            "resi", "sampai", "tiba", "dikirim", "diterima",
            "cepat", "lambat", "lama", "kilat", "express",
        },
        "icon": ">",
    },
    "Product Quality": {
        "keywords": {
            "kualitas", "bagus", "jelek", "rusak", "cacat", "berkualitas",
            "material", "bahan", "awet", "tahan", "kuat", "lemah",
            "quality", "material", "durable", "sturdy", "flimsy",
            "asli", "original", "palsu", "kw", "tiruan", "fake",
            "sempurna", "defect", "bagus", "rapi",
        },
        "icon": "*",
    },
    "Packaging": {
        "keywords": {
            "kemasan", "packing", "pack", "bubble", "wrap", "dus",
            "box", "packaging", "bubble wrap", "aman", "safe",
            "rapi", "neat", "berantakan", "sobek", "kusut",
        },
        "icon": "#",
    },
    "Price": {
        "keywords": {
            "harga", "mahal", "murah", "diskon", "promo", "cashback",
            "price", "expensive", "cheap", "affordable", "worth",
            "value", "sebanding", "overprice", "budget",
        },
        "icon": "$",
    },
    "Customer Service": {
        "keywords": {
            "seller", "toko", "admin", "cs", "chat", "balas",
            "responsif", "ramah", "sopan", "lambat", "slow",
            "service", "support", "response", "helpful", "rude",
            "komplain", "complain", "solusi", "solution",
        },
        "icon": "@",
    },
    "Size/Fit": {
        "keywords": {
            "ukuran", "size", "kecil", "besar", "pas", "sesuai",
            "muat", "longgar", "sempit", "ketat", "fit",
            "kegedean", "kekecilan", "standar",
        },
        "icon": "~",
    },
}

# Intensifiers
INTENSIFIERS = {"sangat", "very", "super", "sekali", "banget", "bgt", "really", "extremely", "paling", "most"}
NEGATORS = {"tidak", "tdk", "ga", "gak", "gk", "nggak", "engga", "bukan", "belum", "not", "no", "never", "dont", "don't"}


@dataclass
class Review:
    text: str
    rating: Optional[float] = None
    source: str = ""
    date: str = ""
    product: str = ""


@dataclass
class AnalysisResult:
    sentiment: str  # positive, negative, neutral
    score: float  # -1.0 to 1.0
    positive_words: list = field(default_factory=list)
    negative_words: list = field(default_factory=list)
    themes: list = field(default_factory=list)
    has_negation: bool = False


def normalize(text: str) -> str:
    """Lowercase and clean text."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text


def analyze_review(review: Review) -> AnalysisResult:
    """Analyze a single review for sentiment and themes."""
    text = normalize(review.text)
    words = set(text.split())

    # Find positive and negative words
    found_pos = []
    found_neg = []

    for word in POSITIVE_WORDS:
        if word in text:
            found_pos.append(word)

    for word in NEGATIVE_WORDS:
        if word in text:
            found_neg.append(word)

    # Check for negation (simple: if negation word appears near sentiment word)
    has_negation = False
    for neg in NEGATORS:
        if neg in words:
            has_negation = True
            break

    # Calculate base score
    pos_count = len(found_pos)
    neg_count = len(found_neg)

    if pos_count + neg_count == 0:
        score = 0.0
    else:
        score = (pos_count - neg_count) / (pos_count + neg_count)

    # Apply rating if available
    if review.rating is not None:
        rating_score = (review.rating - 3) / 2  # Normalize 1-5 to -1 to 1
        score = score * 0.6 + rating_score * 0.4

    # Negation flip (simple heuristic)
    if has_negation and score > 0:
        score = -score * 0.7

    # Determine sentiment
    if score > 0.15:
        sentiment = "positive"
    elif score < -0.15:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    # Extract themes
    themes = []
    for theme_name, theme_data in THEMES.items():
        for kw in theme_data["keywords"]:
            if kw in text:
                themes.append(theme_name)
                break

    return AnalysisResult(
        sentiment=sentiment,
        score=round(score, 3),
        positive_words=found_pos,
        negative_words=found_neg,
        themes=themes,
        has_negation=has_negation,
    )


def load_reviews_csv(filepath: str) -> list[Review]:
    """Load reviews from CSV file."""
    reviews = []

    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = [h.lower().strip() for h in reader.fieldnames]

        # Find column mappings
        text_col = None
        rating_col = None
        source_col = None
        date_col = None
        product_col = None

        for h in headers:
            if h in ("text", "review", "content", "ulasan", "komentar", "comment"):
                text_col = h
            elif h in ("rating", "stars", "bintang", "nilai"):
                rating_col = h
            elif h in ("source", "marketplace", "platform"):
                source_col = h
            elif h in ("date", "tanggal", "waktu"):
                date_col = h
            elif h in ("product", "produk", "item", "nama"):
                product_col = h

        if not text_col:
            # Try first column as text
            text_col = headers[0]

        f.seek(0)
        reader = csv.DictReader(f)

        for row in reader:
            text = row.get(text_col, "").strip()
            if not text:
                continue

            rating = None
            if rating_col and row.get(rating_col):
                try:
                    rating = float(row[rating_col])
                except ValueError:
                    pass

            reviews.append(Review(
                text=text,
                rating=rating,
                source=row.get(source_col, "") if source_col else "",
                date=row.get(date_col, "") if date_col else "",
                product=row.get(product_col, "") if product_col else "",
            ))

    return reviews


def generate_sample_reviews() -> list[Review]:
    """Generate sample Indonesian marketplace reviews for demo."""
    return [
        Review("Barang bagus banget, sesuai gambar. Pengiriman cepat, packing rapi. Recommended seller!", 5, "Tokopedia"),
        Review("Kualitas jelek, bahan tipis. Kecewa beli di sini. Ga sesuai ekspektasi.", 1, "Shopee"),
        Review("Pengiriman lambat, 5 hari baru sampai. Tapi barangnya oke sih, sesuai harga.", 3, "Lazada"),
        Review("Mantap! Original, harga murah dibanding toko lain. Pasti repeat order.", 5, "Tokopedia"),
        Review("Ukuran kekecilan, padahal udah pilih yang XL. Kainnya juga agak kasar.", 2, "Shopee"),
        Review("Seller ramah, fast response. Barang cepat sampai dan kemasan aman banget.", 5, "Bukalapak"),
        Review("Produk rusak waktu sampai, pecah di bagian atas. Udah komplain tapi ga ada solusi.", 1, "Blibli"),
        Review("Lumayan lah untuk harga segini. Ga jelek ga bagus juga. Standar aja.", 3, "Shopee"),
        Review("Barangnya bagus, tapi bubble wrapnya tipis. Untung ga rusak di jalan.", 4, "Tokopedia"),
        Review("PALSU! Ini bukan original, kualitas kw banget. Mau refund susah.", 1, "Shopee"),
        Review("Pengiriman super cepat, semalam langsung sampai. Barang sesuai deskripsi.", 5, "Tokopedia"),
        Review("Warna beda dari foto, lebih gelap. Tapi materialnya lumayan kuat.", 3, "Lazada"),
        Review("Worth it banget! Diskon 50% dapat barang berkualitas. Thank you seller!", 5, "Shopee"),
        Review("Lambat banget responnya, nunggu 2 hari baru dibales. Kurir juga lama.", 2, "Bukalapak"),
        Review("Sempurna! Pas banget ukurannya, bahan adem, harga terjangkau.", 5, "Shopee"),
        Review("Barang sampai sobek, kemasan berantakan. Kecewa berat.", 1, "Tokopedia"),
        Review("Oke aja sih, sesuai harga. Jangan berharap banyak untuk harga segini.", 3, "Lazada"),
        Review("Adminnya helpful banget, bantu pilih ukuran yang pas. Barangnya juga bagus.", 5, "Blibli"),
        Review("Ini barang KW, jelas beda dari yang di foto. Penipu nih seller.", 1, "Shopee"),
        Review("Packing aman, bubble wrap tebal. Barang utuh tidak ada cacat. Puas!", 4, "Tokopedia"),
    ]


def format_bar(value: float, max_val: float, width: int = 20) -> str:
    """Create a text-based bar chart."""
    if max_val == 0:
        return " " * width
    filled = int((value / max_val) * width)
    filled = min(filled, width)
    return "#" * filled + "-" * (width - filled)


def sentiment_color(sentiment: str) -> str:
    """Get ANSI color for sentiment."""
    if sentiment == "positive":
        return C.GREEN
    elif sentiment == "negative":
        return C.RED
    return C.YELLOW


def print_header():
    """Print tool header."""
    print()
    print(f"{C.CYAN}{C.BOLD}  Review Sentiment Analyzer{C.RESET}")
    print(f"{C.DIM}  Marketplace review analysis tool{C.RESET}")
    print()


def print_sentiment_bar(label: str, count: int, total: int, color: str):
    """Print a sentiment distribution bar."""
    pct = (count / total * 100) if total > 0 else 0
    bar_width = 25
    filled = int(pct / 100 * bar_width)
    bar = f"{color}{'#' * filled}{C.DIM}{'-' * (bar_width - filled)}{C.RESET}"
    print(f"  {label:10s} {bar} {count:3d} ({pct:5.1f}%)")


def print_report(reviews: list[Review], results: list[AnalysisResult]):
    """Print the analysis report."""
    total = len(reviews)

    # Sentiment distribution
    pos = sum(1 for r in results if r.sentiment == "positive")
    neg = sum(1 for r in results if r.sentiment == "negative")
    neu = sum(1 for r in results if r.sentiment == "neutral")

    avg_score = sum(r.score for r in results) / total if total > 0 else 0

    print(f"{C.BOLD}  Sentiment Distribution{C.RESET}")
    print(f"  {'─' * 45}")
    print_sentiment_bar("Positive", pos, total, C.GREEN)
    print_sentiment_bar("Neutral", neu, total, C.YELLOW)
    print_sentiment_bar("Negative", neg, total, C.RED)
    print()

    # Overall score
    score_color = C.GREEN if avg_score > 0.15 else (C.RED if avg_score < -0.15 else C.YELLOW)
    print(f"  {C.BOLD}Overall Score:{C.RESET} {score_color}{avg_score:+.3f}{C.RESET}", end="")
    if avg_score > 0.3:
        print(f"  {C.GREEN}(Good){C.RESET}")
    elif avg_score > 0:
        print(f"  {C.YELLOW}(Mixed){C.RESET}")
    elif avg_score > -0.3:
        print(f"  {C.YELLOW}(Needs Attention){C.RESET}")
    else:
        print(f"  {C.RED}(Critical){C.RESET}")
    print()

    # Average rating if available
    ratings = [r.rating for r in reviews if r.rating is not None]
    if ratings:
        avg_rating = sum(ratings) / len(ratings)
        stars = "*" * int(avg_rating) + "-" * (5 - int(avg_rating))
        print(f"  {C.BOLD}Avg Rating:{C.RESET}  {C.YELLOW}{stars}{C.RESET} {avg_rating:.1f}/5.0 ({len(ratings)} rated)")
        print()

    # Theme analysis
    theme_counts = Counter()
    theme_sentiment = defaultdict(lambda: {"pos": 0, "neg": 0, "total": 0})

    for result in results:
        for theme in result.themes:
            theme_counts[theme] += 1
            theme_sentiment[theme]["total"] += 1
            if result.sentiment == "positive":
                theme_sentiment[theme]["pos"] += 1
            elif result.sentiment == "negative":
                theme_sentiment[theme]["neg"] += 1

    if theme_counts:
        print(f"{C.BOLD}  Theme Analysis{C.RESET}")
        print(f"  {'─' * 45}")
        max_count = max(theme_counts.values()) if theme_counts else 1

        for theme, count in theme_counts.most_common():
            icon = THEMES[theme]["icon"]
            ts = theme_sentiment[theme]
            ratio = ts["pos"] / ts["total"] if ts["total"] > 0 else 0

            if ratio > 0.6:
                t_color = C.GREEN
                t_label = "+"
            elif ratio < 0.4:
                t_color = C.RED
                t_label = "-"
            else:
                t_color = C.YELLOW
                t_label = "~"

            bar = format_bar(count, max_count, 15)
            print(f"  {icon} {theme:20s} [{C.DIM}{bar}{C.RESET}] {t_color}{t_label}{C.RESET} {count} mentions")
        print()

    # Top positive and negative words
    all_pos = []
    all_neg = []
    for r in results:
        all_pos.extend(r.positive_words)
        all_neg.extend(r.negative_words)

    if all_pos:
        print(f"{C.BOLD}  Top Positive Keywords{C.RESET}")
        print(f"  {'─' * 45}")
        for word, count in Counter(all_pos).most_common(8):
            bar = "#" * min(count, 20)
            print(f"  {C.GREEN}+{C.RESET} {word:20s} {C.DIM}{bar}{C.RESET} {count}")
        print()

    if all_neg:
        print(f"{C.BOLD}  Top Negative Keywords{C.RESET}")
        print(f"  {'─' * 45}")
        for word, count in Counter(all_neg).most_common(8):
            bar = "#" * min(count, 20)
            print(f"  {C.RED}-{C.RESET} {word:20s} {C.DIM}{bar}{C.RESET} {count}")
        print()

    # Actionable insights
    print(f"{C.BOLD}  Actionable Insights{C.RESET}")
    print(f"  {'─' * 45}")

    insights = []

    # Check shipping complaints
    ship_data = theme_sentiment.get("Shipping", {"pos": 0, "neg": 0, "total": 0})
    if ship_data["total"] > 0 and ship_data["neg"] / ship_data["total"] > 0.4:
        insights.append("Shipping is a pain point. Consider switching couriers or adding tracking updates.")

    # Check quality issues
    qual_data = theme_sentiment.get("Product Quality", {"pos": 0, "neg": 0, "total": 0})
    if qual_data["total"] > 0 and qual_data["neg"] / qual_data["total"] > 0.4:
        insights.append("Product quality complaints are high. Review product photos and descriptions for accuracy.")

    # Check packaging
    pack_data = theme_sentiment.get("Packaging", {"pos": 0, "neg": 0, "total": 0})
    if pack_data["total"] > 0 and pack_data["neg"] / pack_data["total"] > 0.4:
        insights.append("Packaging needs improvement. Use thicker bubble wrap or double boxing.")

    # Check price perception
    price_data = theme_sentiment.get("Price", {"pos": 0, "neg": 0, "total": 0})
    if price_data["total"] > 0 and price_data["pos"] / price_data["total"] > 0.6:
        insights.append("Price perception is positive. Consider slight price increase for better margins.")

    # Check customer service
    cs_data = theme_sentiment.get("Customer Service", {"pos": 0, "neg": 0, "total": 0})
    if cs_data["total"] > 0 and cs_data["neg"] / cs_data["total"] > 0.4:
        insights.append("Customer service needs attention. Improve response time and resolution rate.")

    # General
    if neg > pos and neg > neu:
        insights.append("Overall sentiment is negative. Urgent review of product/service needed.")
    elif pos > neg * 2:
        insights.append("Strong positive sentiment. Leverage good reviews for marketing.")

    if not insights:
        insights.append("No critical issues detected. Keep monitoring reviews regularly.")

    for i, insight in enumerate(insights, 1):
        print(f"  {i}. {insight}")

    print()

    # Individual reviews (top positive and negative)
    sorted_by_score = sorted(enumerate(results), key=lambda x: x[1].score)

    print(f"{C.BOLD}  Review Samples{C.RESET}")
    print(f"  {'─' * 45}")

    # Top 3 negative
    print(f"  {C.RED}Worst Reviews:{C.RESET}")
    for idx, result in sorted_by_score[:3]:
        review = reviews[idx]
        text_preview = review.text[:80] + ("..." if len(review.text) > 80 else "")
        rating_str = f" [{review.rating}/5]" if review.rating else ""
        source_str = f" ({review.source})" if review.source else ""
        print(f"    {C.RED}{result.score:+.2f}{C.RESET}{rating_str}{source_str} {text_preview}")

    print()

    # Top 3 positive
    print(f"  {C.GREEN}Best Reviews:{C.RESET}")
    for idx, result in sorted_by_score[-3:]:
        review = reviews[idx]
        text_preview = review.text[:80] + ("..." if len(review.text) > 80 else "")
        rating_str = f" [{review.rating}/5]" if review.rating else ""
        source_str = f" ({review.source})" if review.source else ""
        print(f"    {C.GREEN}{result.score:+.2f}{C.RESET}{rating_str}{source_str} {text_preview}")

    print()


def export_json(reviews: list[Review], results: list[AnalysisResult], filepath: str):
    """Export analysis results to JSON."""
    data = []
    for review, result in zip(reviews, results):
        data.append({
            "text": review.text,
            "rating": review.rating,
            "source": review.source,
            "sentiment": result.sentiment,
            "score": result.score,
            "themes": result.themes,
            "positive_words": result.positive_words,
            "negative_words": result.negative_words,
        })

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"  Exported to {filepath}")


def main():
    parser = argparse.ArgumentParser(
        description="Marketplace Review Sentiment Analyzer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("file", nargs="?", help="CSV file with reviews")
    parser.add_argument("--sample", action="store_true", help="Run with sample Indonesian reviews")
    parser.add_argument("--interactive", action="store_true", help="Enter reviews manually")
    parser.add_argument("--export", help="Export results to JSON file")
    parser.add_argument("--top", type=int, default=10, help="Number of top items to show")

    args = parser.parse_args()

    print_header()

    reviews = []

    if args.sample:
        reviews = generate_sample_reviews()
        print(f"  {C.DIM}Using {len(reviews)} sample Indonesian marketplace reviews{C.RESET}")
    elif args.file:
        if not os.path.exists(args.file):
            print(f"  {C.RED}Error: File not found: {args.file}{C.RESET}")
            sys.exit(1)
        reviews = load_reviews_csv(args.file)
        print(f"  {C.DIM}Loaded {len(reviews)} reviews from {args.file}{C.RESET}")
    elif args.interactive:
        print(f"  {C.DIM}Enter reviews (empty line to finish):{C.RESET}")
        while True:
            try:
                text = input("  > ").strip()
                if not text:
                    break
                reviews.append(Review(text))
            except EOFError:
                break
        print(f"  {C.DIM}Got {len(reviews)} reviews{C.RESET}")
    else:
        parser.print_help()
        sys.exit(0)

    if not reviews:
        print(f"  {C.RED}No reviews to analyze.{C.RESET}")
        sys.exit(1)

    # Analyze all reviews
    results = [analyze_review(r) for r in reviews]

    # Print report
    print_report(reviews, results)

    # Export if requested
    if args.export:
        export_json(reviews, results, args.export)

    # Summary line
    pos = sum(1 for r in results if r.sentiment == "positive")
    neg = sum(1 for r in results if r.sentiment == "negative")
    print(f"  {C.DIM}Analyzed {len(reviews)} reviews: {pos} positive, {neg} negative{C.RESET}")
    print()


if __name__ == "__main__":
    main()
