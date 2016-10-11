# CatchAlong API

Prerequisites:
- Docker + Compose

Running locally: `git clone ...` then `make dev-setup`, and you'll have the
following ready to be hacked on:

- A 3-node RethinkDB cluster, already networked
- 3 NodeJS containers (the app runtime); each will be pointed to a specific
RethinkDB container. Each runtime is spun up w/ the PM2 process manager, and
will restart the application within each container when files are changed
locally.
- An Nginx reverse-proxy to the runtime containers; this serves as the single
entry point for the application.

#### Todo
- Deploy via compose to 3 node cluster. Each Node will run *both* RethinkDB and
the api runtime. The goal is a homogeneous infrastructure: with data automatically
replicated via Rethink, theres a likelihood we'll avoid network hits due to
data locality automatically.
- Cross-node networking for ^^^
- Log aggregation
