# @version ^0.3
# vim: ft=python

owner: public(address)
name: public(String[100])

# __init__ is not called when deployed from create_forwarder_to
@external
def __init__():
  self.owner = msg.sender
  self.name = "Foo"

# call once after create_forwarder_to
@external
def setup(_name: String[100]):
  assert self.owner == ZERO_ADDRESS, "owner != zero address"
  self.owner = msg.sender
  self.name = _name
