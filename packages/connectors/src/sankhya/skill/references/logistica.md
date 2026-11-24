# Logística

Both lists start at `page` 0 and say with `temMais` whether another follows.

- Carriers (`/v1/parceiros/transportadoras`): code, name, CNPJ, city. `modifiedSince` (`dd/mm/aaaa hh:mm`).
- Load orders (`/v1/logistica/ordens-carga`) of one company: vehicle, driver, carrier, region, status.

Vehicles and drivers come by code; their registers are read by SQL.
