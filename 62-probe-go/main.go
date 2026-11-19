package main

import "fmt"

func fee(price, rate int) int { return price * rate / 100 }

func main() { fmt.Println(fee(100000, 5)) }
