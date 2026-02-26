import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SubdomainVendingMachineModule", (m) => {
  const registry = m.getParameter("registry", "0x7d284aaac6e925aad802a53c0c69efe3764597b8");
  const resolver = m.getParameter("resolver", "0x1e7ae43e3503efb886104ace36051ea72b301cdf");
  const rifToken = m.getParameter("rifToken", "0x19f64674d8a5b4e652319f5e239efd3bc969a1fe");
  const parentNode = m.getParameter(
    "parentNode",
    "0x3f883ec5bd19fe34954681096ae40d4c4f61bfff1b051edce4f60f4cbbc0d623", // namehash("random1996.rsk")
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

