# proxy-scanner
Proxy Test Tool for checking your proxies

## Features
- piping
- threading
- file input
- HTTP proxy

## Coming soon
- Progress (web) Interface
- SOCKet Secure proxy


## Installing

Currently, only a manual available install method is provided.
Once we're ready for deployment I'll publish it for easier installing.

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
