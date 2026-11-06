import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'cli'))

import analyze


class SentimentTests(unittest.TestCase):
    def check(self, text, rating=None):
        return analyze.analyze_review(analyze.Review(text, rating))

    def test_ok_inside_toko_is_not_positive(self):
        result = self.check('Stok barang di toko kosong')
        self.assertEqual(result.sentiment, 'neutral')
        self.assertNotIn('ok', result.positive_words)

    def test_negator_away_from_sentiment_word_does_not_flip(self):
        result = self.check('Pelayanan bagus, tidak ada keluhan')
        self.assertEqual(result.sentiment, 'positive')
        self.assertIn('bagus', result.positive_words)

    def test_negated_positive_is_negative(self):
        result = self.check('Barang tidak bagus, kecewa')
        self.assertEqual(result.sentiment, 'negative')
        self.assertIn('kecewa', result.negative_words)
        self.assertIn('bagus', result.negated_words)

    def test_negated_complaint_is_positive(self):
        result = self.check('Tidak ada komplain, respon cepat')
        self.assertEqual(result.sentiment, 'positive')
        self.assertIn('cepat', result.positive_words)
        self.assertIn('komplain', result.negated_words)

    def test_negative_phrase_is_not_double_counted(self):
        result = self.check('Kualitas jelek, tidak sesuai deskripsi')
        self.assertEqual(result.sentiment, 'negative')
        self.assertIn('tidak sesuai', result.negative_words)
        self.assertNotIn('sesuai', result.positive_words)

    def test_exact_ok_token_is_positive(self):
        result = self.check('Barang OK, pengiriman cepat')
        self.assertEqual(result.sentiment, 'positive')
        self.assertIn('ok', result.positive_words)

    def test_rating_still_influences_score(self):
        positive = self.check('Barang datang', 5)
        negative = self.check('Barang datang', 1)
        self.assertGreater(positive.score, negative.score)
        self.assertEqual(positive.sentiment, 'positive')
        self.assertEqual(negative.sentiment, 'negative')


if __name__ == '__main__':
    unittest.main()
