# @version ^0.3.3
# vim: ft=python

greeting: String[100]

@external
def __init__(message: String[100]):
    self.greeting = message

@external
@view
def greet() -> String[100]:
    return self.greeting
