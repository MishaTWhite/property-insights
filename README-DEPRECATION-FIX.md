# Deprecation Warning Fix

## Issue
The application was showing a deprecation warning:

```
[DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
```

This warning was coming from `spawn-command.js:9`, which is a dependency used by the `concurrently` package that we use to run both the server and client simultaneously.

## Solution Implemented
After trying several approaches to suppress the deprecation warnings without success, we've implemented a more robust solution:

**Replaced concurrently with npm-run-all**

We've switched from using `concurrently` to `npm-run-all`, which serves the same purpose of running multiple npm scripts in parallel but doesn't have the deprecation issue:

```json
"scripts": {
  "start": "npm-run-all --parallel server client",
  ...
}
```

We've also:

1. Added `npm-run-all` as a dependency in package.json:
```json
"devDependencies": {
  "concurrently": "^8.2.2",
  "npm-run-all": "^4.1.5"
}
```

2. Kept the `--no-deprecation` flag in the server's package.json file as an additional precaution:
```json
"scripts": {
  "start": "node --no-deprecation src/index.js",
  ...
}
```

3. Maintained the old scripts with the `NODE_NO_WARNINGS=1` environment variable as alternatives:
```json
"scripts": {
  "start-with-warnings": "NODE_NO_WARNINGS=1 concurrently \"npm run server\" \"npm run client\"",
  "start-with-wrapper": "node suppress-deprecation-warnings.js \"npm run server\" \"npm run client\"",
  ...
}
```

This solution completely avoids the package that was causing the deprecation warning, rather than just trying to suppress the warnings.

## Alternative Solutions
Other potential solutions that weren't implemented:

1. Update concurrently to a newer version (if one becomes available that fixes this issue)
2. Switch to npm-run-all instead of concurrently
3. Create a custom script to start both server and client without relying on concurrently

The implemented solution was chosen because it:
- Is minimally invasive
- Doesn't change existing behavior
- Doesn't require changing dependencies
- Solves the immediate problem of reducing console noise

Note that this is purely a cosmetic fix - the deprecated API usage still exists in the dependency, but it doesn't affect application functionality.