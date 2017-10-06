# apiconnect-soa-transfer-tool

IBM Service Oriented Architecture Transfer Tool. 


## Features

The tool provides a command-line tool for transferring services and their metadata from IBM WebSphere Service Registry and Repository (WSRR) to API Connect. The tool can transfer SOAP and REST services from WSRR and take the service metadata from WSRR: properties, classifications, state. The tool takes a set of services belonging to an organization and transfers them into API Connect. The tool can take a single service version and transfer it.

The tool can be customized to search for services and metadata in various ways, if you have a custom profile. The tool can be customized to change which data from WSRR is used to create the API definition, if you have custom metadata. The tool will transfer in production ("Operational") services and applications, and can be customized to transfer services and applications in other states.

The tool can push APIs and Products to drafts and can optionally publish Products and APIs to Catalogs.

The tool can find consumers of a service in WSRR and create Applications in API Connect and subscribe these Applications to APIs, to represent the consumers of a WSRR service in API Connect.


## Installation

```
$ npm install -g apiconnect-soa-transfer-tool
```

Prerequisites:
- Node.js version 4.x.
- The API Connect toolkit must be at level 5.0.8.0 or a higher fix pack of API Connect 5.0.


## Usage 

Get help on the **soatt** command set:

```
$ soatt
```

## Documentation

See [DETAILS.md](wsrr2apic/DETAILS.md) for full details of the tool.


## License

The project uses the Apache License Version 2.0 software license. See [LICENSE.txt](wsrr2apic/LICENSE.txt).


## Contributing to the project

Details of how to contribute to this project are documented in the [CONTRIBUTING.md](CONTRIBUTING.md) file.


## Developing

The source code is developed as an eclipse project, see [DETAILS.md](wsrr2apic/DETAILS.md).
