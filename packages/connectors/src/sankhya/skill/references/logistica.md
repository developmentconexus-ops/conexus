# Logística

- `transportadoras`: the carriers (code, name, CNPJ, city). First page: 1; `pagination.hasMore` says if there is another. `modifiedSince` (`dd/mm/aaaa hh:mm`).
- `ordensCarga`: the load orders of one company (vehicle, driver, carrier, region, status). First page: 1; `pagination.hasMore` says if there is another (as text or as a boolean).

Vehicles and drivers are named by code in the answer; their registers come through the read door.
