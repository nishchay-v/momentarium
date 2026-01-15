FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Create the workspace directory early
RUN mkdir -p /workspaces/momentarium-dev && chown node:node /workspaces/momentarium-dev

WORKDIR /workspaces/momentarium-dev
USER node