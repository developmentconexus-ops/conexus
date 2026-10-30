# Mensagens

- `mensagensNaoLidas`: how many after-sale messages are unread, by order or pack.
- `mensagensDoPacote`: the messages of one pack. It always sends `mark_as_read=false`, so reading never marks them as read in the store's account. Take the pack from `pacote`.
