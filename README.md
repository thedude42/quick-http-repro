# quick-http-repro
tools aimed at rapid reproduction of http byte streams derrived from packet or stream sources

quickhttprepro.js is intended to be a command line tool for producing a list of files, either by being provided a direcotry containing those files or a pcap file to generate the files from.

SimpleHttpParser.js reads the files from a known directory, and provides the relevant data to a template which produces a simple nodejs http application that responds to the URI's parsed from the HTTP messages found in the parsed files.

The intent of this tool is to provide a mechanism to reproduce the HTTP byte stream observed in the provided tcp stream data.  The expected use cases are that the stream data is provided via a pcap file, which is transformed using the "tcpflow" tool; and that the stream may be provided by the output of "wireshark" using the "follow tcp stream" function to generate a "RAW" file output of the stream.

The tool will produce either a single file or one javascript file and the required source files for the HTTP response data.

As of right now features are minimally tested.  I don't expect this to work as described, possibly at all, presently.
