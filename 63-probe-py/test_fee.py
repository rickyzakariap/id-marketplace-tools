import unittest

import main


class FeeTest(unittest.TestCase):
    def test_fee(self) -> None:
        self.assertEqual(main.fee(100000, 0.05), 5000)


if __name__ == "__main__":
    unittest.main()
