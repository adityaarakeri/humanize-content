Acme raised a $40M Series B led by Sequoia. They make an observability platform.

The pitch is speed. I tried it on our staging cluster last month and queries that took
Datadog several seconds came back fast enough that I stopped noticing them. That was the
whole difference for us, honestly nothing else about it stood out.

They plan to spend the money on EMEA sales and log management. Crowded market, but most
teams I know still run three tools and lose time switching between them, so maybe.

Install notes are in the repo (see `docs/setup.md`), and the API is plain REST:

```bash
curl -s https://api.example.com/v1/query --data '{"q": "latency p99"}'
```
