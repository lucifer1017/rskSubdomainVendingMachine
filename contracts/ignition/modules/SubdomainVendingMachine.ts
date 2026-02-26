import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SubdomainVendingMachineModule", (m) => {
  const registry = m.getParameter("registry", "0x7d284aaac6e925aad802a53c0c69efe3764597b8");
  const resolver = m.getParameter("resolver", "0x0000000000000000000000000000000000000000");
  const rifToken = m.getParameter("rifToken", "0x19f64674d8a5b4e652319f5e239efd3bc969a1fe");
  const parentNode = m.getParameter(
    "parentNode",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  );
  const initialPrice = m.getParameter("initialPrice", 0n);

  const svm = m.contract("SubdomainVendingMachine", [
    registry,
    resolver,
    rifToken,
    parentNode,
    initialPrice,
    m.getAccount(0),
  ]);

  return { svm };
});

