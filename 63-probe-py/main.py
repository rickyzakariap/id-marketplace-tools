import argparse


def fee(price: float, rate: float) -> float:
    return round(price * rate, 2)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("price", type=float)
    print(fee(parser.parse_args().price, 0.05))


if __name__ == "__main__":
    main()
