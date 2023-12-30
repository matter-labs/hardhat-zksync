# @version ^0.3.11
# vim: ft=python

greeting: String[100]

@external
def __init__():
    self.greeting = "Hello World"

@external
@view
def greet() -> String[100]:
    return self.greeting
