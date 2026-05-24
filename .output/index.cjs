
    if (process.env.PORT.startsWith('\\')) {
      process.env.NITRO_UNIX_SOCKET = process.env.PORT
      delete process.env.PORT
    }
    import('./server/index.mjs');
    