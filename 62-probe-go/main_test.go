package main

import "testing"

func TestFee(t *testing.T) {
	if got := fee(100000, 5); got != 5000 {
		t.Fatalf("got %d", got)
	}
}
