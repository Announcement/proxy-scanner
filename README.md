# proxy-scanner
Proxy Test Tool for checking your proxies

## Features
- piping
- threading
- file input
- HTTP proxy
- Progress (web) Interface
- SOCKet Secure proxy

## Coming soon
- Documentation
- Testing


## Installing

Currently, only a manual available install method is provided.
Once we're ready for deployment I'll publish it for easier installing.

### NPM Install

``` sh
npm install --global proxy-scanner
```

### Manual install
``` sh
git clone https://github.com/Announcement/proxy-scanner
cd proxy-scanner
npm install --global
```

## Usage

### Pipe examples

`ptt <<< 127.0.0.1:8080`
`echo "127.0.0.1:8080" | ptt`

### File example

`ptt -f ../../proxies.txt`
