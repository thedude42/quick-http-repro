# quick-http-repro

  Usage: quickhttprepro [options]

  Options:

    -h, --help                output usage information
    -V, --version             output the version number
    -d --flowdir [directory]  directory containing list of flows. default is  undefined
    -w --wireshark            causes the search for flows to expect one file per tcp connectioin. without this option we look for tcpflow style file names
    -p --pcap [filename]      pcap file.  if omitted, the directory specified by --flowdir is consulted. the --wireshark argument is ignored
    --complete                only dump complete flows (where we see handshake and close of the stream)
    -t --tcp-port [portnum]   Port number to use in the http final application

quickhttprepro.js is a node.js application that produces another node.js application.  The application that is produces is an http server that will serve byte-pre-byte response reproduction when the appropriate URI is requested.  There is no consideration of the request headers  or body when producing the response.

SimpleHttpParser.js provides the parsing of a single file which contains HTTP messages. The messages can either be sequential requesr/response transactions (as one would get from a wireshark tcp stream) or the messages can be in the form of tcpflow output files.  SimpleHttpParser.js provides minimum validation of the http messages, namely that headers conform to RFC 7230, and that Content-Length or chunked Transfer-Encoding byte lengths are correct.

This is a tool aimed at rapid reproduction of http byte streams derrived from packet or stream sources. The expected use cases are that the stream data is provided via a pcap file, which is transformed using the "tcpflow" tool, or that the stream may be provided by the output of "wireshark" using the "follow tcp stream" function to generate a "RAW" file output of the stream.  Mixtures of both types of files are allowed.

The tool will produce a single file node.js http application utilizing the required source files for the HTTP response bodies.

The current version is 0.1.0.  This translates to "I finally got this working but really need to test it more before I call it 1.0".
