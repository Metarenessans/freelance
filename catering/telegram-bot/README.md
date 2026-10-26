# Optional Telegram subscriber worker

This sanitized copy is **disabled by default**. Running `python main.py` without
`TELEGRAM_ENABLED=true` exits without making Telegram requests or sending messages.
The API helpers independently enforce the same opt-in, even when a token is present.
The worker reads only its own `.env`; it does not search parent/backend environment files.
No token, chat ID, proxy credentials or authenticated session is included.

The worker uses `requests` long polling and the sibling Django backend ORM to
link authorized subscribers. It needs backend dependencies and the same **new,
isolated persistent database**, along with a new `SECRET_KEY`, in its process
environment. It is not an HTTP server.

Keep it disabled for the public demo. If intentionally enabled later, create a
new test bot and new test subscribers; never reuse original tokens or recipients.
Review authorization and consent before enabling phone matching or notifications.
The existing phone-contact flow needs contact-ownership hardening before real use.
Never enable phone lookups with a personal Telegram account/session for the demo.

```sh
python -m pip install -r requirements.txt
python main.py
```

The expected default result is an informational message that Telegram is disabled.
The legacy GitLab deployment job is disabled. Deploy a worker only after explicitly
reviewing its new environment and configuration settings. No messages were sent during verification.
