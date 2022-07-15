# @version ^0.3.3
# vim: ft=python

interface Greeter:
    def setup(name: String[100]): nonpayable

forwarder: public(address)

@external
def deploy(_masterCopy: address, _greeting: String[100]):
    self.forwarder = create_forwarder_to(_masterCopy)
    # Greeter.__init__ was not called, else this would fail
    Greeter(self.forwarder).setup(_greeting)
