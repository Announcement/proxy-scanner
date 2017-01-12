import * as socks from 'socksv5';

// HTTP Proxy Support
export let configureProxy = it => {
  return {
    host: it.host,
    port: it.port,
    path: 'http://api.ipify.org',
    headers: {
      Host: 'api.ipify.org'
    },
    agent: false
  };
}

// SOCKSv5 Proxy Support
export let configureSocks = it => {
  let socksConfig = {
    proxyHost: it.host,
    proxyPort: it.port,
    auths: [ socks.auth.None() ]
  };

  return {
    host: 'api.ipify.org',
    port: 443,
    path: '/',
    agent: new socks.HttpsAgent(socksConfig)
  };
}
