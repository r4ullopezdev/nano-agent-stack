# Design Note 001: Runtime Boundaries

The stack keeps four boundaries explicit from the start:

1. workflow topology
2. provider abstraction
3. skill registry
4. observability and approval hooks

This keeps the codebase smaller than many agent frameworks while still showing the seams that matter for real infrastructure work.
