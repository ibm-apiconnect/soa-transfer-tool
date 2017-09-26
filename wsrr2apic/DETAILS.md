# apiconnect-soa-transfer-tool

IBM Service Oriented Architecture Transfer Tool, hereafter known as the SOA Transfer Tool.

## Features

The tool provides a command-line tool for transferring services and their metadata from IBM WebSphere Service Registry and Repository (WSRR) to API Connect. The tool can transfer SOAP and REST services from WSRR and take the service metadata from WSRR: properties, classifications, state. The tool takes a set of services belonging to an organization and transfers them into API Connect. The tool can take a single service version and transfer it.

The tool can be customized to search for services and metadata in various ways, if you have a custom profile. The tool can be customized to change which data from WSRR is used to create the API definition, if you have custom metadata. The tool will transfer in production ("Operational") services and applications, and can be customized to transfer services and applications in other states.

The tool can push APIs and Products to drafts and can optionally publish Products and APIs to Catalogs.

The tool can find consumers of a service in WSRR and create Applications in API Connect and subscribe these Applications to APIs, to represent the consumers of a WSRR service in API Connect.

For how the tool maps WSRR to API Connect see [WSRR artifacts to APIC artifacts](#wsrr-artifacts-to-apic-artifacts).


## Limitations

Limitations as of this version:

Only SOAP services are supported which use SOAP/HTTP. REST services which have an attached Swagger on the REST Service Interface are supported. REST services without a Swagger are supported but will be created with a single path of "/".

The tool does not map the life cycle state of a service to the Identified/Realized/Specified states of an API.

The API Connect toolkit must be installed and at level 5.0.8.0 or higher fix pack of 5.0. The API Connect management node server therefore must also be at level 5.0.8 or higher. The tool does not check the level of the API Connect toolkit (because there is no API to do so) and therefore you will encounter errors if using an incorrect level of the toolkit and the API Connect server.

You need an internet connection to npmjs.com to install the tool.


## Skills needed to use the tool

The following skills are ideal when using the tool:

- Knowledge of your WSRR profile and which changes have been made from the GEP
- Knowledge of WSRR XPath
- Knowledge of API Connect
- Knowledge of HandlebarsJS templates
- Knowledge of YAML


## Installing

The transfer tool relies upon the API Connect toolkit. 

The API Connect toolkit must be at level 5.0.8.0 or a higher fix pack of API Connect 5.0.8.

First install the API Connect toolkit following the instructions in the [Knowledge Center](http://www.ibm.com/support/knowledgecenter/en/SSMNED_5.0.0/com.ibm.apic.toolkit.doc/tapim_cli_install.html). 

Ensure the apic command is on the path by entering the following command:

`apic -v`

Note: If on Windows, do not use Cygwin (Windows bash shell emulator) to enter Node or npm commands. Use the Windows command shell instead.

Create a directory where the transfer tool configuration will be kept.

From the command line, change into the directory you created.

Enter the following command to install the tool from npmjs.com:

`npm install -g apiconnect-soa-transfer-tool`

Note: an internet connection to npmjs.com is required to install the tool.

Ensure the transfer tool has been installed by entering the following command:

`soatt -v`

The output will be of the form:

`apiconnect-soa-transfer-tool Transfer Tool version 1.0.0`


## Usage

The transfer tool is run from a command prompt. When the tool is installed, the command `soatt` is put on the global path. To run the tool, change to the directory where the tool configuration will be kept and enter the following command:

`soatt <options>`

Where <options> are the command line options below.

```

  -h, --help                              Command usage
  -t, --transferMode string[]             Specify mode of transfer of Services
                                          from WebSphere Service Registry and
                                          Repository(WSRR) to API
                                          Connect(APIC)
                                          Modes:
                                          1. Generate and upload service
                                          metadata from WSRR into APIC
                                          2. Generate swagger documents from
                                          WSRR for later upload to APIC(via 3)
                                          3. Upload generated swagger
                                          documents from the local filesystem
                                          into APIC
                                          4. From WSDLs on the local file
                                          system, generate swagger documents
                                          for later upload into APIC
                                          A bsrURI can be supplied for modes 1
                                          and 2 to target a given Service
                                          regardless of organization
                                          -o is required for modes 2 and 4
                                          -i is required for modes 3 and 4
  -w, --testWSRRConnection                Perform test connection for WSRR
                                          Server
  -a, --testAPICConnection                Perform test connection for APIC
                                          Server through the APIC CLI
  -o, --outputDirectory string            Specify directory for output files
                                          for later upload. Required for
                                          transfer mode=2 and 4. If defined
                                          for transfer mode=1 then this
                                          overrides input directory value
  -i, --inputDirectory string             Specify directory containing files
                                          for upload to API Connect. Required
                                          for transfer mode=3 and 4. This
                                          value is ignored for transfer mode=1
  -v, --version                           Get Build version
  -f, --connectionPropertiesFile string   Path to connection properties file
  -l, --reviewlogs string[]               Process logs to a more readable
                                          format, can be supplied with a file
                                          location to process a given file
```

By default the tool will look in the current directory for the configuration properties file.

### Example usage:

```
soatt -t 2 9cb8619c-5eea-4ac5.b6a7.fe64e7fea733 -o Output
```

Transfer to disk the service version with bsrURI `9cb8619c-5eea-4ac5.b6a7.fe64e7fea733` into the directory `Output`.

```
soatt -t 1
```

Transfer the organization in configurationproperties.properties in the current directory, and push to API Connect.

```
soatt -t 2 -o Output
```

Transfer the organization in configurationproperties.properties in the directory `Output` but do not push to API Connect.

```
soatt -t 3 -i Output
```

Transfer to API Connect the captured files in the directory `Output`. Use after running `soatt -t 2` or `soatt -t 4`.

```
soatt -t 4 -i Input -o Output
```

Create api and product yaml files from WSDLs and XSDs that are stored in the directory `Input` and saves in `Output` 


## File space usage

The tool and its dependencies require approximately 360 megabytes of disk space. 

The tool stores logs files in the user folder and limits these to 100 megabytes in total size for all log files. The logs are stored in the user directory in `.soatt/logs`.

The tool will download service information from WSRR for each service that is transferred. This includes the WSDL and XSD for the service, and various files which are described in the section "Working file structure". The file structure is stored in the user directory in `.soatt/files` if a specific directory is not set.

In Windows the user directory can typically be found in `C:\USERS\<user name>\` if Windows is installed onto drive C:.


## Transfer modes

Transfer modes are as follows:

### Mode 1

Mode 1 processes the services in WSRR one by one, and for each service, generates the API, Product and consumers Yaml and then pushes the Product and API to API Connect. If configured, mode 1 will also publish to Catalogs and create consumers.

Mode 1 will store the files created on disk. These files can later be used again to push to API Connect, or edited and the API Connect toolkit used. 

### Mode 2

Mode 2 processes the services in WSRR one by one, and for each service, generates the API, Product and consumers Yaml and stores these on disk to the location specified by the outputDirectory parameter.

If any files already exist in the output directory then these files will be overwritten. The output directory is not cleared before the tool does the capture.
 
### Mode 3

Mode 3 reads the contents of the directory specified by the inputDirectory parameter, and for each service version found, pushes the Product and API to API Connect.  If configured, mode 3 will also publish to Catalogs and create consumers.

Mode 3 will push all service versions found in the input directory. Therefore when running in mode 3 it is important to check which services are in the input directory and ensure no extra services are present.

### Mode 4

Mode 4 requires both input and output directories to be specified. Mode 4 will read the input directory and expects to find one or more directories, each containing WSDL and XSD files in the correct structure. Each directory is treated as a service. Mode 4 will generate an API and Product and store these in the output directory, in a format suitable for mode 3 to push to API Connect. Mode 4 is for use if you have a set of WSDL and XSD which defines services and wish to push these to API Connect as SOAP APIs.

For example if the input directory is (input) then:

```
(input)/wsdl1/wsdl.wsdl
```
Where wsdl.wsdl is a monolithic WSDL.

```
(input)/wsdl2/wsdl2.wsdl
(input)/wsdl2/xsd2.xsd
```
Where wsdl2.wsdl imports XSD `./xsd2.xsd`.

```
(input)/wsdl3/wsdl3.wsdl
(input)/wsdl3/xsd/xsd3.xsd
```
Where wsdl3.wsdl imports XSD `./xsd/xsd3.xsd` where xsd3.xsd is in a sub directory in the import statement, it must be in a sub directory in the input.

Mode 4 will compress the WSDL and XSD files found for each service. If a file has relative imports using sub-directories then the imported files must be in the correct sub-directory. Mode 4 uses the API Connect Toolkit to generate a SOAP API, then generates a Product Yaml. The template for the Product Yaml by default takes the name and version from the SOAP API Yaml to make the Product name and version. 

If there is a Yaml file named `metadata.yaml` in the directory containing the WSDL and XSD, this Yaml file will be combined with the generated SOAP API Yaml file, with this file taking precedent. The `metadata.yaml` should contain fragments of a Swagger which is to override that in the generated SOAP API, in order to provide metadata for the API. The product template is given an object which is the final API Swagger, either just the generated SOAP API or the combined metadata and SOAP API.

If any files already exist in the output directory then these files will be overwritten. The output directory is not cleared before the tool does the capture.  

### Mode 5

Mode 5 allows the running of custom plugins within the tool allowing the plugins to use the provided libraries. Mode 5 takes the name of the plugin which is the name of the main js file, an input value, input directory and output directory.

The plugin name, input director and output directory are required. For the input value this is a single value, if multiple additional values are required the recommendation is to either provide a input that is surrounded by quotes or store the values in a file in the input directory. 

Mode 5 does not support the same level of checking in its pre-launch steps as modes 1,2 and 3 to ensure that they can make any necessary connections to WSRR or APIC servers. these can be included in the plugin using these modes as examples to ensure all connection properties are correct. The properties are set for WSRR and APIC perform the plugin is run. 

The plugin must exist in the tools plugins directory.

## Publishing

If configured, the tool will publish each Product (and included API) to one or more Catalogs from drafts. If Spaces is enabled on a Catalog the Product will be published inside a space of the Catalog. Only one version of a Product can exist in a Catalog regardless of whether Spaces are enabled or not. For configuration options see [Configuration file](#configuration-file).

If a Product publish fails the tool attempts to remove the Product from any Catalogs to which it has been published. This is done by first setting the Product to retired state, and then by deleting the Product from the Catalog. If any of these steps fail, the tool will log the failure and continue to try to remove the Product from other Catalogs. It is possible given permissions or approvals set on a Catalog that the tool will be unable to retire or delete a Product, in which case you will have to manually remove the Product from the Catalog. If Spaces have been enabled on any of the catalogs that are being published to, then the product will be removed from the space.


## Creating Consumers

If configured, the tool will create Applications in Catalogs and developer organizations for consumers of the services in WSRR. Each Application is subscribed to the Product which contains the API. The subscription is to the Plan in the Product which corresponds to the SLD in WSRR which the consumer in WSRR was subscribed to. Given a subscribing application or service in WSRR establishes an Service Level Agreement (SLA) to a Service Level Definition (SLD) of a service version, the SLA represents the subscription and the SLD the service level, which is then represented by the Plan in API Connect. For configuration options see [Configuration file](#configuration-file).

For each API that is processed, the consumers are created after the API is published to the catalogs.

In an API Connect developer organization an Application can only subscribe to one Plan in a Product, and cannot subscribe to multiple Plans in the same Product. Therefore if a WSRR consumer is subscribed to the same WSRR service multiple times, the tool will log a warning when creating consumers and will only create one subscription to the Plan for the Product and API corresponding to the WSRR service. Which Plan is subscribed to is not deterministic and will be the first subscription that is created in the consumers YAML file, but the first subscription in the consumers YAML file cannot be guaranteed.

In order to create consumers, the API must be published to a Catalog or Catalogs. Therefore the publish setting and consumers settings must be enabled for the consumers to be created.

If a consumer create fails the tool will attempt to undo any previous applications that have been created, updated, and undo any subscriptions that have been created or deleted, in all Catalogs processed. Once the consumers have been undone, the tool will attempt to remove the API from the Catalogs that it was published to. If anything goes wrong during the attempt to undo consumers or publishes, the tool will log the error, skip the current operation and continue to attempt other undo operations. 


## Tutorial

Once you have installed the tool, the following tutorial will show how to transfer a service from WSRR to API Connect.

### Register a service in WSRR

Register the Eligibility service in WSRR. You can follow the [tutorial in the WSRR Knowledge Center to create the organization Common services](http://www.ibm.com/support/knowledgecenter/en/SSWLGF_8.5.6/com.ibm.sr.doc/tutorial_smp_create_org_structure.html) and [register the Eligibility service in WSRR](http://www.ibm.com/support/knowledgecenter/en/SSWLGF_8.5.6/com.ibm.sr.doc/tutorial_smp_dashboard_govern_existing_service.html). 

Or download the GeppedObjects.zip from this [tutorial](http://www.ibm.com/developerworks/websphere/library/techarticles/1212_willoughby/1212_willoughby.html) and import them into WSRR. 

You will end up with a business service called "Account eligibility" with version 1.0, with a single SLD called "SLD - Eligibility service " and a single production endpoint for "http://www.jkhle.com/jkhle/services/Eligibility".

### Configure the tool

A default configuration file is installed along with the tool in the folder `<NPM home>/node_modules/soatt/connectionproperties.properties`. Copy this configuration file into the directory where the transfer tool configuration will be kept and edit the settings. Be sure to keep the name as `connectionproperties.properties`.

Set `wsrrHostname` and `wsrrPort` to the host name and port of your WSRR server. Set `wsrrProtocol` to https if your WSRR is secure, and http otherwise. Ensure that if set to https then the wsrrPort is set to the correct port, by default 9443. Typically you would use the same values in the URL of the WSRR Web UI or WSRR Dashboard. 

If your WSRR is secure, set `wsrrUsername` and `wsrrPassword` to a user who has permission to view content in WSRR. Typically these are values that you can use to log into the WSRR Web UI or WSRR Dashboard. 

Set the `wsrrOrg` property to "Common services" as follows:

`wsrrOrg=Common services`

Set `apiUsername` and `apiPassword` for a user who can log into your API Connect API Manager UI (typically located on /apim on the management node). This user must have permission to create drafts, for instance a user with the role "API Developer".

It is not necessary to set `apiDeveloperUsername`, `apiDeveloperPassword` and `apiVersion`.

Set `apiIdentifier` to the API Connect publish target URL for your API Connect catalog. To find this URL, log into the API Manager on the management node using the credentials you provided in `apiUsername` and `apiPassword`, and from the menu click "Dashboard" then on your catalog, click the Show catalog identifier button. This will pop a dialog which has text such as `apic config:set catalog=apic-catalog://apicmanagement.domain.com/orgs/wsrrdev/catalogs/sb`. The API Connect publish target URL is the part starting with `apic-catalog`, in this example `apic-catalog://apicmanagement.domain.com/orgs/wsrrdev/catalogs/sb`.
If the catalog has Spaces enabled the URL that is required will be for example 
`apic-space://apicmanagement.domain.com/orgs/wsrrdev/catalogs/sb/spaces/devspace`

If you have multiple catalogs you can select any catalog, because you will not be publishing your API to the catalog in this tutorial.

### Testing the configuration

Next test the configuration. Change to the directory where the tool configuration is kept and test the WSRR configuration by entering the following command:

`soatt --testWSRRConnection`

The tool should output a message showing that the connection worked, for example:

`2016-03-14 14:50:05: Connection to WSRR successful`

Test the API Connect configuration by entering the following command:

`soatt --testAPICConnection`

The tool should output a message showing that the connection worked, for example:

`2016-09-19 16:53:38: Connection to API Connect Server successful`

The API Connect test uses the API Connect Toolkit to login to the API Connect server. If the toolkit is not installed and on your path, the test will fail.

### Doing the transfer

Next you run the transfer for services in Common services. Change to the directory where the tool configuration is kept and begin the transfer by entering the following command

`soatt --transferMode 1`

The tool will find the "Account eligibility" business service and its version "Eligibility service" and generate a SOAP API, then push the SOAP API to API Connect.

### Examining the results in API Connect

Log into the API Manager in API Connect and switch to Drafts. In Products you will see "Eligibility service" which was created from the service version. 

Click on "Eligibility service" to see details of the Product. The name is taken from the WSRR service version and the description is taken from the WSRR business service. In the APIs section is the API "Eligibility service" which was created from the service version. There is a single plan called "SLD - Eligibility service" which includes the API.

Click on the API "Eligibility service" to see details of the API. The name, description and version are taken from the WSRR service version. The base path is "/jkhle/services/Eligibility" which is taken from the endpoint. In the Paths section there is a single path "/validate". In the Definitions section there are multiple definitions taken from the WSDL. 

Click on the Assemble tab. On the canvas is a proxy policy. Click on the proxy policy on the canvas to see details. The proxy policy invokes the URL taken from the WSRR endpoint which is "http://www.jkhle.com/jkhle/services/Eligibility" and passes through the HTTP method used and the contents of the request. If there was a back end service to invoke, the API would provide a proxy to the service. 

### Examining the data on the file system

When the tool runs, it leaves data on the file system. In the case of an error, you can examine the data to see what the tool did. Open your user home directory and change into the directory `.soatt/files`. If you imported the sample service then the bsrURI of the business service will be `80348480-5e75-45d9.8b26.72bd9c7226e5` and the business service directory will be called `80348480-5e75-45d9.8b26.72bd9c7226e5`. If you created the sample service then the bsrURI of the business service will be different. Change into the business service directory.

In the business service directory, the `docs` directory contains the charter for the business service.

In the business service directory is a directory for the service version. If you imported the sample service the directory is called `0805d308-7f9f-4f7d.a6a3.090b7709a3b0`. Change into this directory. 

The file `product.yaml` contains the YAML definition for the Product. The file `api.yaml` contains the YAML Swagger definition for the API, which you viewed in the Source tab in the API Manager. The file `0805d308-7f9f-4f7d.a6a3.090b7709a3b0_wsdls.zip` contains the WSDL for the service. The `docs` directory contains documents attached on the `artifacts` relationship. 

In the `logs` directory are various diagnostic files which can be used for troubleshooting.


## Suggested approach to using the tool

A suggested approach to using the tool is as follows:

- Make an API in API Connect stand alone to understand the desired API you wish to create with the tool. The tool will allow you to create API definitions by mapping WSRR metadata to the API definition, but you need to know what should be in those definitions. It is recommended to use API Connect extensions to model extra metadata you add into the Swagger definitions.
- Replicate the Swagger that defines this API into a copy of the API and Product templates. Configure the tool to use the copies of the templates.
- Examine your WSRR model changes from standard GEP/SMP and read this read me to find which queries will not work. Generally if extra properties or classifications have been added then these can be used. If relationship names or model names have been changed then the queries can be altered to use the new names. If you have added a new modelled object and relate it to an existing object using a new relationship, and want the properties of this new object to be used in your APIs, then you will need to alter the tool source code to fetch the new object.
- Tailor the queries the tool uses to work with your model by changing the configuration.
- Replace any hard coded values in the API and Product templates with substitutions from the WSRR data that is used to process the templates.
- Create a temporary Provider Organization, Catalog and Developer Organization in API Connect to test with. Use these when working with the tool.
- Do a transfer with the test API Connect provider organization on a single service version of a SOAP and a REST service with publish off.
- Examine the results in API Connect drafts
- Publish the API to a test catalog and invoke the API to ensure it works.
- Do a transfer with the test API Connect provider organization on a single service version of a SOAP and a REST service with publish and consumer creation enabled.
- Examine the results in API Connect drafts
- Do a transfer to a test API Connect provider organization of a WSRR organization.
- Publish a selection of APIs and invoke them to ensure they work.


## Transfer scenarios

The tool by default will find only service versions in the "Operational" state, and application versions in the "Operational" or "VersionApproved" (for the Service Management Profile) state. This enables the tool to be used to transfer services which are in production.

For a transfer scenario where services in other states are required, the tool can be customized to look for services and applications in other states. Refer to [Example override - transferring services in deprecated state](#example-override-transferring-services-in-deprecated-state).  

For a migration scenario where all services are required, the tool can be customized to not check for state. Refer to [Example override - transferring services in all states](#example-override-transferring-services-in-all-states).


## Frequently Asked Questions

Following are some frequently asked questions and the answers.

### I have a customized GEP

In which case you may need to configure the queries used to fetch data from WSRR to reflect any model or relationship changes.

All data is fetched with all properties and classifications, and these are available to place in the templates.

### I have some WSRR metadata that is not appearing in the Product or API

The templates used to create the Product and API yaml files are basic and do not take all WSRR metadata. They are designed to be customized to add your specific metadata properties into the definitions.


## Configuring

Configuration points in the tool are:

- Configuration file
- Queries
- Templates

### Configuration file

The configuration file is "connectionproperties.properties" and contains the configuration for connecting to the WSRR server and the API Connect management server. 

A default configuration file is installed along with the tool in the folder `<NPM home>/node_modules/soatt/connectionproperties.properties`. Copy this configuration file into the directory where the transfer tool configuration will be kept and edit the settings.  

On Windows `<NPM home>` is typically in your user home directory under `AppData/Roaming/npm`. On Unix `<NPM home>/node_modules` is typically in `~/lib/node_modules`.

Each setting is documented in the configuration file.

The organization in WSRR to transfer is specified in the "wsrrOrg" property.

The "apiUser" and "apiPassword" settings identify the user who is logged into the API Connect API Manager provider organization. This user must have Edit permission for the abilities "Draft Products" and "Draft APIs". Typically the role "API Developer" will have these permissions.

The API Connect publish target URL is used to obtain the hostname of the API Connect management server and the provider organization name.

The API Connect publish target URL is documented in the knowledge center: 
http://www.ibm.com/support/knowledgecenter/en/SSMNED_5.0.0/com.ibm.apic.apionprem.doc/tapic_catalog_url.html

The format of the API Connect publish target URL is as follows: `catalog=apic-catalog://management_cluster_hostname_or_address/orgs/URL_path_segment_of_your_provider_organization/catalogs/URL_path_segment_of_your_catalog`

The API Connect Developer Portal base host name is documented in the knowledge center:
http://www.ibm.com/support/knowledgecenter/en/SSMNED_5.0.0/com.ibm.apic.apirest.doc/api_calls.html

The "publish" property controls if the tool will publish Products to a Catalog or Catalogs. The default is false. Values are "true" or "false".

The "publishCatalogs" property specifies which Catalogs to publish to, if "publish" is set to true. This is a comma separated list of catalog names, for example `sb,production` or `sb`. If "publish" is true but "publishCatalogs" is empty then the Catalog given in the "apiIdentifier" URL property is used. 

If any of the catalogs that are to be published to have Spaces enabled, then the Space that the product is to be published to must be specified. All the catalogs are specified in the "publishCatalogs" property. The spaces related to a catalog are stored as properties in the form of:
`apicSpaceName_<catalog>=<space name>`
for example
`publishCatalogs=sb,production`
`apicSpaceName_production=production-space`
Spaces does not affect publishing to multiple catalogs, only those catalogs that have Spaces enabled require a space to be provided.

The "createConsumers" property controls if the tool will create Applications and subscribe them to APIs, in the developer organization for a Catalog or Catalogs. The default is false. Values are "true" or "false". The "publish" property must be set to true for the tool to create consumers.

If "createConsumers" is set to true, then the developer organization display name to create Applications in, for a Catalog, must be specified. All the catalogs are specified in the "publishCatalogs" property. The developer organization display name related to a catalog is stored as a property in the form of:
`apiDeveloperOrgName_<catalog>=<developer organization display name>`
for example
`publishCatalogs=sb,production`
`apiDeveloperOrgName_sb=wsrrdevSb`
`apiDeveloperOrgName_production=wsrrdevProd`

Note this must be either the developer organization ID or the display name of the developer organization and not the name. The display name of a developer organization can be found in the Developer Organization page of the Community section or Settings of a Catalog. To retrieve the IDs of the developer organsiations that a user belongs with a given name to the following curl command can be run:
`curl -k -u '<devorg owner email>'�https://<APIM server>/v1/portal/orgs?name=wsrrdev`
This returns a list of devorgs with a given name. the removal of `?name=<name>` will return all the organizations that the user belongs to.

Overrides can be put into the configuration file. Where allowed, overrides are documented in their respective sections below.


### User permissions

In the configuration three users are configured. These require various permissions.

#### WSRR user

The WSRR user is configured in the properties `wsrrUsername` and `wsrrPassword`. This user requires read permissions in WSRR for the services contained in the WSRR organization that is specified in `wsrrOrg`. If transferring a single service version, this user requires read permissions in WSRR for the service version.

A service in WSRR consists of the various business models which make the service; business service, service version, service level definition, service level agreement, service endpoint, REST service interface. A service also consists of the WSDL and XSD documents, and the logical objects created from these. The WSRR user must be able to read all of these artifacts.

#### API Connect provider organization user

The API Connect provider organization user is configured in the properties `apiUsername` and `apiPassword`. This user is logged into the API Connect provider organization configured in the property `apiIdentifier` in the path segment for the provider organization. 

The API Connect provider organization user will push to drafts. 

The API Connect provider organization user will publish Products to the "publish catalogs" identified in the property `publishCatalogs` in state Published. If spaces are enabled in the Catalog then the user will publish to the space identified in the property `apicSpaceName_<catalog>=<space name>`

If an error occurs the API Connect provider organization user will set Products in the publish catalogs to state Retired and will then delete the Products from the publish catalogs. 

Therefore the API Connect provider organization user requires the following permissions on the provider organization and all catalogs identified:

Provider Organization level:

- Draft Products
- Draft APIs

Catalog and Space level:

- API Products

Note: the tool does not support the use of Approvals for Product Lifecycle for any Catalogs the tool publishes to. All actions in the Catalog must be configured to not require Approvals.

#### API Connect developer organization user

The API Connect developer organization user is configured in the properties `apiDeveloperUsername` and `apiDeveloperPassword`. This user is logged into the API Connect developer organization identified in the property `apiDeveloperOrgName_<catalog>=<developer organization display name>`. The user performs work in the Catalog identified in this property. 

The API Connect developer organization user will create Applications, update Applications, create subscriptions and delete subscriptions in the Catalogs and developer organizations specified.

The API Connect developer organization user must be the developer organization owner.


### Connecting to the Bluemix API Connect service

The tool will work against the Bluemix API Connect service. You use your IBM ID credentials for the API Connect provider organization user credentials. You can copy the Catalog Identifier from the Dashboard view in the Bluemix API Connect user interface. You can create a new developer organization which is not a "Bluemix developer organization" and assign an owner, and then use the owner credentials for the API Connect developer organization user credentials.


### Working file structure

The tool stores data on the file system during the transfer process and leaves the files afterward. The files are stored in the user directory in `.soatt/files/`. There is one directory per business service and each service version has a directory under the business service directory.

```
/
/<business service bsrURI>/
/<business service bsrURI>/<service version bsrURI>_wsdls.zip - WSDL and XSDs for the service in a ZIP file 
/<business service bsrURI>/docs/ - artifact and charter documents
/<business service bsrURI>/<service version bsrURI>/
  /api.yaml - API YAML
  /product.yaml - product YAML
  /logs/wsdl.yaml - WSDL Yaml - generated WSDL YAML from API Connect command (if SOAP service)
  /logs/wsrr.yaml - WSRR Yaml - generated and validated YAML from API template and WSRR data
  /logs/apiFromTemplate.yaml - generated YAML string from API template and WSRR data
  /logs/productFromTemplate.yaml - generated YAML string from Product template and WSRR data
  /logs/consumersFromTemplate.yaml - generated YAML string from consumers template and WSRR data
  /logs/wsrrdata.json - WSRR data object passed to templates
  /logs/swaggerFromWSRR_<name of swagger document> - Swagger document downloaded from WSRR (if REST and a document exists)
  /docs/ - artifact documents for all services and documents on any REST service interface
  /result.json - result of transfer (success, failure and diagnostics)
  /bsrURI_wsdls.zip - ZIP of the WSDL and XSD documents
  /consumers.yaml - consumer information YAML
```

### WSRR artifacts to APIC artifacts

The mapping of WSRR to API Connect is:

| WSRR                                 | API Connect |
| ----                                 | ----------- |
| Service Version                      | API |
| Business Service and Service Version | Product |
| Service Level Definition (SLD)       | Plan |
| Consuming Application                | Application in a Catalog |
| Service Level Agreement (SLA)        | Plan subscription of an Application in a Catalog |


The mapping of WSRR to APIC artifacts is done with the queries and templates. By default the tool follows this process:

- The business service is discovered by querying for objects of type Business Service and who have a relationship on `ale63_owningOrganization` to objects with the provided organization name. This uses the tool query named "BusinessServiceByOwningOrg". The business service metadata is used in the product definition, see [The default product template](#the-default-product-template).
- For each business service, the versions are retrieved by querying for objects of type Service Version which are on the end of the relationship `gep63_capabilityVersions` from the business service. This uses the tool query named "ServiceVersionsForBusinessService". All artifact documents are retrieved by downloading anything on the end of the relationship `ale63_artifacts` using the tool query named "ArtifactDocumentsForService". The charter document is retrieved by downloading anything on the end of the relationship `gep63_charter` using the tool query named "CharterDocumentForService". The artifact and charter documents are stored on the file system and are not pushed to API Connect.
- The service version metadata is used in the product definition and the API definition, see [The default product template](#the-default-product-template) and [The default SOAP API template](#the-default-soap-api-template).
- For each service version, all artifact documents are retrieved by downloading anything on the end of the relationship `ale63_artifacts`. This uses the tool query named "ArtifactDocumentsForService" and "CharterDocumentForService". These artifacts are stored on the file system and are not pushed to API Connect. 
- For each service version, all SLDs are retrieved by querying for objects on the end of the relationship `gep63_provides` using the tool query named "SLDsForServiceVersion".
- The SLD name and description is used to create a plan in the product. The plan includes the single API that is created with the name of the service version name. Other attributes of the plan are specified in the product template and are not derived from the SLD. 
- For each SLD that is returned, all SOAP endpoints are retrieved by checking that the SLD is of type Service Level Definition or subtypes, and querying for objects on the relationship `gep63_availableEndpoints` which are of type `http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint`. This uses the tool query named "SOAPEndpointsForSLD". The first endpoint which is classified for the Production WSRR environment and is on the first SLD is used for both the `basePath` in the API, and for the invoke target in the API assembly. 
- For each SLD that is returned, all REST endpoints are retrieved by checking that the SLD is of type Service Level Definition or subtypes, and querying for objects on the relationship `gep63_availableEndpoints` which are of type `http://www.ibm.com/xmlns/prod/serviceregistry/profile/v8r0/RESTModel#RESTServiceEndpoint`. The first endpoint which is classified for the Production WSRR environment and is on the first SLD is used for both the `basePath` in the API, and for the invoke target in the API assembly. If a Swagger document is supplied with Service Version, the `basePath` from the Swagger file is used instead. If the Swagger does not contain a `basePath` APIC uses a `basePath` of `/` as the default. If you have a `basePath` of `/` with your path starting with `/` your path will contain a `//`  
- For each SLD that is returned, the consuming applications are found. First all SLAs which reference the SLD and are in the state `SLAActive` are found by querying for objects which reference the SLD with the relationship from the SLA called `gep63_agreedEndpoints` and are of type `http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceLevelAgreement`. This uses the tool query named "ConsumingSLAsForSLD". 
- For each consuming SLA that is returned, the owning version is found if the version is owned by the same organization that was used to initiate the transfer. This is done by querying for objects which reference the SLA with the relationship from the version called `gep63_consumes` and the objects must reference the object with name of the initial organization which is on the relationship called `ale63_owningOrganization`. This uses the tool query named "ConsumingVersionsForSLA".
- For each consuming version that is returned, the consuming capability is found. This is done by querying for objects which reference the version with the relationship from the capability called `gep63_capabilityVersions`. This uses the tool query named "OwningCapabilityForVersion".
- For both the consuming version and consuming capability, the owning organization is retrieved. This is done by querying for objects which are on the end of the relationship named `ale63_owningOrganization`. This uses the tool query named "OwningOrganizationForEntity".
- Provided a consuming SLA, version and capability have been found, these are added to the WSRR data object. If a version or capability cannot be found, the consumer is ignored. The version and capability objects in the consumer have their owning organization details added. For any consumers the consumers template is used to generate the `consumers.yaml` file which captures the consumers found. If creating of consumers is enabled, for each consumer an Application is created in the configured Catalog and developer organization, and that Application is subscribed to the API which was created for the service. 
- For each service version if the version contains any SOAP endpoints, the root WSDL documents are retrieved by querying to find the Web Service objects on the relationship `gep63_providedWebServices`. For each Web Service returned the WSDL Service object is found on the relationship `sm63_wsdlServices`. For each WSDL Service returned, the source document is found on the relationship `document`. These use the tool query named "WSDLForServiceVersion" which combines the described queries into one XPath expression. 
- For each root WSDL document that is discovered, that is of type WSDLDocument, follow the `import`, `include` and `redefines` relationships to discover child WSDL and XSD, and get those, then repeat until all documents are found.
- For a SOAP service, the API Connect toolkit is used to generate an API swagger which represents the WSDL using the downloaded WSDL and XSD documents. This is then overlaid with the API template to create the final API definition. When the API is pushed to API Connect the WSDL and XSD documents are also sent and can be downloaded from the Developer Portal if the API is published to a catalog. 
- If the version does not contain any SOAP endpoints but does contain some REST endpoints, the tool queries to get any Swagger documents. The Swagger documents are queried by first finding the REST Services on the relationship `gep63_providedRESTServices(.)`. For each REST Service, the REST Service Interface is queried by finding objects on the relationship `rest80_serviceInterface`. For each REST Service the definition documents are queried by finding objects on the relationship `rest80_definitionDocument`. These use the tool query named "RESTInterfaceDocumentsForServiceVersion" which combines the described queries into one XPath expression. The definition documents can be any sort of binary document, therefore the tool then filters to only include documents with the extensions ".yaml" ".yml" or ".json". If no definition documents are found then the API is assumed to be a swaggerless REST API and the swaggerless REST API template is used, see [The default REST Swaggerless API template](#the-default-rest-swaggerless-api-template). If swagger documents are found, then the first swagger document is used and combined with the output of the REST-with-Swagger template, see [The default REST with Swagger API template](#the-default-rest-with-swagger-api-template). 


### Queries

Each object is retrieved to depth 1 with relationships, classifications and properties metadata.

The queries are stored in lib/WSRR/wsrrqueries.js and the tool query names given are used to override the queries. Each query is stored as an object and the "query" property defines the XPath to run. The XPath is listed here for convenience. Queries are provided one parameter which is inserted into the XPath using "%s".

Queries can be overridden by adding an entry into the configuration properties file with name of the name of the query and value of the Xpath to use. For example to override the query to retrieve business services by owning organization to do an exact match on the organization name, use the following entry in the configuration properties file:

```
BusinessServiceByOwningOrg=/WSRR/GenericObject[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessCapability') and ale63_owningOrganization(.)/@name='%s']
```

##### BusinessServiceByOwningOrg
Query for Business Services which have an owning organization with a name that matches that specified, and have at least one version in Operational state. This checks that the type of the object returned is `http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService` or a subclass.

- Parameter: The name of the organization.
- Default XPath: `/WSRR/GenericObject[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService') and ale63_owningOrganization(.)/matches(@name,'%s','i') and gep63_capabilityVersions(.)/classifiedByAnyOf(., 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational')]`

##### ServiceVersionsForBusinessService
Query for all service versions of the specified business service. This checks that the type of object returned is `http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion` or a subclass and is in Operational state.

- Parameter: The bsrURI of the business service.
- Default XPath: `/WSRR/GenericObject[@bsrURI='%s']/gep63_capabilityVersions(.)[classifiedByAllOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion', 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational')]`

##### SLDsForServiceVersion
Query for all service level definitions (SLDs) of the specified service version.

- Parameter: The bsrURI of the service version.
- Default XPath: `/WSRR/GenericObject[@bsrURI='%s']/gep63_provides(.)`

##### SOAPEndpointsForSLD
Query for all SOAP Endpoints of the specified SLD. This checks that the SLD is of type `http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceLevelDefinition` or a subclass, and that the endpoints returned are of type `http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint` or a subclass.

- Parameter: The bsrURI of the SLD.
- Default XPath: `/WSRR/GenericObject[@bsrURI='%s' and classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceLevelDefinition')]/gep63_availableEndpoints(.)[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint')]`

##### RESTEndpointsForSLD
Query for all REST Endpoints of the specified SLD. This checks that the SLD is of type `http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceLevelDefinition` or a subclass, and that the endpoints returned are of type `http://www.ibm.com/xmlns/prod/serviceregistry/profile/v8r0/RESTModel#RESTServiceEndpoint` or a subclass.

- Parameter: The bsrURI of the SLD.
- Default XPath: `/WSRR/GenericObject[@bsrURI='%s' and classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceLevelDefinition')]/gep63_availableEndpoints(.)[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v8r0/RESTModel#RESTServiceEndpoint')]`

##### WSDLForServiceVersion
Query to get all root WSDL documents of the specified service version.

- Parameter: The bsrURI of the service version.
- Default XPath: `/WSRR/GenericObject[@bsrURI='%s']/gep63_providedWebServices(.)/sm63_wsdlServices(.)/document(.)`

##### ArtifactDocumentsForService
Query to get all artifact documents of the specified service or version using the artifacts relationship.

- Parameter: The bsrURI of the service or version.
- Default XPath: `/WSRR/GenericObject[@bsrURI='%s']/ale63_artifacts(.)`

##### CharterDocumentForService
Query to get the charter document of the specified business service.

- Parameter: The bsrURI of the business service.
- Default XPath: `/WSRR/GenericObject[@bsrURI='%s']/gep63_charter(.)`

##### RESTInterfaceDocumentsForServiceVersion
Query to get all REST interface documents of the specified service version, using the REST service interface attached to the version.

- Parameter: The bsrURI of the service version.
- Default XPath: `/WSRR/GenericObject[@bsrURI='%s']/gep63_providedRESTServices(.)/rest80_serviceInterface(.)/rest80_definitionDocument(.)`

##### ConsumingSLAsForSLD
Query to get all SLAs which consume the specified SLD. The SLA must be in the state `SLAActive` and be of type `http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceLevelAgreement` or a sub class.

- Parameter: The bsrURI of the SLD.
- Default XPath: `/WSRR/GenericObject[classifiedByAllOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceLevelAgreement', 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#SLAActive') and gep63_agreedEndpoints(.)/@bsrURI='%s']`

##### ConsumingVersionsForSLA
Query to get the version which uses the SLA specified to consume an SLD. The version must belong to the organization identified and must be in Operational or VersionApproved state.

- Parameter 1: The bsrURI of the SLA.
- Parameter 2: The name of the organization the version belongs to.
- Default XPath: `/WSRR/GenericObject[gep63_consumes(.)/@bsrURI='%s' and ale63_owningOrganization(.)/matches(@name,'%s','i') and classifiedByAnyOf(., 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational', 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#VersionApproved')]`

##### ConsumingVersionsForSLASingleSV
Query to get the version which uses the SLA specified to consume an SLD. Used when transferring a single version. The version must be in Operational or VersionApproved state.

- Parameter 1: The bsrURI of the SLA.
- Default XPath: `/WSRR/GenericObject[gep63_consumes(.)/@bsrURI='%s' and classifiedByAnyOf(., 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational', 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#VersionApproved')]`

##### OwningCapabilityForVersion
Query to get the capability for the specified version.

- Parameter: The bsrURI of the version.
- Default XPath: `/WSRR/GenericObject[gep63_capabilityVersions(.)/@bsrURI='%s']`

##### OwningOrganizationForEntity
Query to get the owning organization for the business capability or capability version specified.

- Parameter: The bsrURI of the business capability or capability version.
- Default XPath: `/WSRR/GenericObject[@bsrURI='%s']/ale63_owningOrganization(.)`


##### Debugging queries
In the log the tool outputs when it is running a query, which query it is running and the bsrURI passed to the query. The object being used is output with the name and bsrURI, and the version for a service version.

An example query output is:

`2016-07-26 12:26:11: Fetching versions for business service with name 'MathService' bsrURI '0f94240f-cfff-4f86.8ed3.a12b21a1d37e' using query 'ServiceVersionsForBusinessService'`

Here the query ServiceVersionsForBusinessService is being run and the parameter for the bsrURI is "0f94240f-cfff-4f86.8ed3.a12b21a1d37e". 

If the query is not returning the correct data, you can run the Xpath directly against your WSRR server. See [Retrieving metadata by query](http://www.ibm.com/support/knowledgecenter/en/SSWLGF_8.5.6/com.ibm.sr.doc/rwsr_rest_retrieving_metaquery.html) and [Graph query](http://www.ibm.com/support/knowledgecenter/en/SSWLGF_8.5.6/com.ibm.sr.doc/rwsr_rest_retrieving_metaquery_2.html)  

Note you must escape certain characters for the URL to be valid. See the knowledge center links for more details.

For example to run the query BusinessServiceByOwningOrg against WSRR 8.5 running on wsrr.domain.com where the name of the owning organization is "Common services", the URL would be:

`https://wsrr.domain.com:9443/WSRR/8.5/Metadata/XML/GraphQuery?query=/WSRR/GenericObject%5BclassifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel%23BusinessService')%20and%20ale63_owningOrganization(.)/matches(@name,'Common%20services','i')%5D`

The results of the query will show if the expected data is being returned.

You can also create an action in Dashboard to run an Xpath expression. See [Creating and editing Actions](https://www.ibm.com/support/knowledgecenter/en/SSWLGF_8.5.6/com.ibm.sr.doc/twsr_DB_editing_activities.html)

For each version, the final data object is written to the directory "logs" and is called "wsrrdata.json". You can check that the data was retrieved correctly using this. See "How the templates work and the object passed to them" for details of how the final data object is created from the query results.

##### Example override - changing the type of REST endpoint

To change the type of endpoint that is retrieved for a REST service, the query "RESTEndpointsForSLD" should be overridden. This query looks for endpoints of type `http://www.ibm.com/xmlns/prod/serviceregistry/profile/v8r0/RESTModel#RESTServiceEndpoint`. This type should be changed to look for another type. For example if your REST endpoint is of type `http://www.ibm.com/xmlns/prod/serviceregistry/profile/v7r0/ManualEndpointModel#ManualHTTP` then the entry in the configuration is:

```
RESTEndpointsForSLD=/WSRR/GenericObject[@bsrURI='%s' and classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceLevelDefinition')]/gep63_availableEndpoints(.)[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v7r0/ManualEndpointModel#ManualHTTP')]
```

##### Example override - transferring only SOAP services

To transfer only the SOAP services in an organization, the query which retrieves the service version should be changed to retrieve just those versions which have a bound web service. This assumes that your profile uses the bound web service relationship on the service version. In WSRR XPath a relationship condition only checks for the existance of the relationship, therefore the check actually checks that the object on the relationship named `gep63_providedWebServices` has a relationship named `sm63_wsdlServices`. The entry in the configuration is:

```
ServiceVersionsForBusinessService=/WSRR/GenericObject[@bsrURI='%s']/gep63_capabilityVersions(.)[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion') and gep63_providedWebServices(.)/sm63_wsdlServices(.)]
```

##### Example override - transferring only REST services

To transfer only the REST services in an organization, the query which retrieves the service version should be changed to retrieve just those versions which have a bound REST service. This assumes that your profile uses the bound REST service relationship on the service version. In WSRR XPath a relationship condition only checks for the existance of the relationship, therefore the check actually checks that the object on the relationship named `gep63_providedRESTServices` has a relationship named `rest80_serviceInterface`. The entry in the configuration is:

```
ServiceVersionsForBusinessService=/WSRR/GenericObject[@bsrURI='%s']/gep63_capabilityVersions(.)[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion') and gep63_providedRESTServices(.)/rest80_serviceInterface(.)]
```

##### Example override - transferring services in Deprecated state

To transfer services which are in the states Operational or Deprecated, the query which retrieves the business service by organization should be changed to additionally look for the Deprecated state on the version. The entry in the configuration is:

```
BusinessServiceByOwningOrg=/WSRR/GenericObject[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService') and ale63_owningOrganization(.)/matches(@name,'%s','i') and gep63_capabilityVersions(.)/classifiedByAnyOf(., 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational','http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Deprecated')]
```

The query which retrieves the service version should be changed to additionally look for the Deprecated state, and to look for any of the classifications, and to remove the check for the Service Version to avoid query complexity. The entry in the configuration is:

```
ServiceVersionsForBusinessService=/WSRR/GenericObject[@bsrURI='%s']/gep63_capabilityVersions(.)[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Deprecated', 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational')]
```

The query which retrieves consuming versions for an SLA should be changed to additionally look for the Deprecated state. The entry in the configuration is:

```
ConsumingVersionsForSLA=/WSRR/GenericObject[gep63_consumes(.)/@bsrURI='%s' and ale63_owningOrganization(.)/matches(@name,'%s','i') and classifiedByAnyOf(., 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational', 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#VersionApproved','http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Deprecated')]
``` 

##### Example override - transferring services in all states

To transfer services in all states for a migration scenario, or other reasons, the queries should be modified to stop checking which state services are in. The query which retrieves the business service by organization should be changed to not check the state on the version. The entry in the configuration is:

```
BusinessServiceByOwningOrg=/WSRR/GenericObject[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService') and ale63_owningOrganization(.)/matches(@name,'%s','i')]
```

The query which retrieves the service version should be changed to not check the state. The entry in the configuration is:

```
ServiceVersionsForBusinessService=/WSRR/GenericObject[@bsrURI='%s']/gep63_capabilityVersions(.)[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion')]
```

The query which retrieves consuming versions for an SLA should be changed to not check the state. The entry in the configuration is:

```
ConsumingVersionsForSLA=/WSRR/GenericObject[gep63_consumes(.)/@bsrURI='%s' and ale63_owningOrganization(.)/matches(@name,'%s','i')]
```

The query which retrieves consuming versions for an SLA for a single service version transfer should be changed to not check the state. The entry in the configuration is:

```
ConsumingVersionsForSLASingleSV=/WSRR/GenericObject[gep63_consumes(.)/@bsrURI='%s']
```

##### Example override - Transferring services with multiple WSDLs
To transfer services defined by mutliple WSDLs, the query that retrieves the wsdls for Service Versions must be replaced to retrieve the associated WSDLs from a different source belonging to the object. The query must be replaced to retrieve the WSDL off of one of the endpoints on the Service that has been suitable classified to differentiate them.   

APIC does not support the creation of APIs where the service being converted is defined by multiple WSDLs which split the service based on a category like environment. For example a Service could be defined by 4 WSDLs, which each WSDL representing one of DEV, TEST, PRE-PROD and PROD. If during the transfer process an error stating "Error: The file <Service Name>.yaml already exists" this means that the service is defined my multiple WSDLs and all the WSDLs that define the service exist in the ZIP, preventing the completion of the transfer process. 


```
WSDLForServiceVersion=/WSRR/GenericObject[@bsrURI='%s']/gep63_provides(.)/gep63_availableEndpoints(.)[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production')]/sm63_soapAddress(.)/document(.)
```

Warning: this override enables the returning of a Single WSDL and the example uses the Production Endpoint to retrieve the WSDL. However as a single WSDL is retrieved some information about the service may be lost. The results of this override should be manually verified in the produced api.yaml to ensure either no data is lost or the data lost is deemed acceptable. Only one copy of a given environments WSDL will be downloaded.

##### Example override - Transferring consuming applications that do not belong to the consumed services Owning Organisation
To transfer consuming applications of a service version where they belong to different Owning Organisation to requirement to match on the OwningOrganisation needs to be removed on the retrieval of the Consuming Versions.

```
ConsumingVersionsForSLA=/WSRR/GenericObject[gep63_consumes(.)/@bsrURI='%s' and classifiedByAnyOf(., 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational', 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#VersionApproved')]
``` 

### Filtering

Filtering is done at two points. 

Data is retrieved from WSRR using Xpath queries, which can be overridden and have various filters specified, for example classifications, properties or state. Therefore instead of retrieving all service versions, you can filter to retrieve only service versions in the Operational state (in production). Or only retrieve SLDs which are Approved, or only retrieve endpoints which are online and for the Production environment.

With the final data, it is turned into API and Product definitions using templates. These templates can be customized or different templates used. The default SOAP template will generate an APIC assembly which invokes the SOAP service using the first endpoint (from the first SLD) that is in the environment endpoint collection for the Production environment:

`target-url: '{{endpointNameByClassifications version.slds "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"}}'`

This uses a helper which can find the name of the first endpoint found in a list of SLDs where the endpoint is classified as "Production". The helper can be used to find other sorts of endpoints, or look on a specific SLD. 

Because of how the default templates are written, all endpoints for Staging or Dev or any other environment are not used. The template can be altered to instead pick a different endpoint. For example an endpoint for the Staging environment. This is another form of filtering.

The template is processed using the Handlebars library (http://handlebarsjs.com/) which allows for loops over arrays and objects, and if conditions. The library also allows for custom helpers which can filter values. The tool registers the following helpers:
 
- host - for a URL string, outputs just the host name
- path - for a URL string, outputs just the path part
- apiName - for a string, outputs a safe version for use as an x-ibm-name
- multiline - for a string, preserves line feeds in the value in the yaml
- onlyClassified - block helper that only outputs the block it contains if the object passed to it has the classification specified. For example the following will only output the content if the this object is classified by "http://www.ibm.com/Endpoint#Test":
```
{{#onlyClassified this "http://www.ibm.com/Endpoint#Test"}}
... some content
{{/onlyClassified}}
```
- endpointNameByClassifications - for an array of SLD objects, or a single SLD, returns the name of the first endpoint found that has the provided classifications. The helper looks on all SLDs in the array provided, or the SLD provided, and looks at the endpoints array on each SLD. For example the following will return the first name of the endpoint classified by "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production" and "http://www.ibm.com/Endpoint#Test": 
```
{{endpointNameByClassifications version.slds "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production" "http://www.ibm.com/Endpoint#Test"}}
```
- classificationToValue - for a WSRR object, is given a list of classification URI to value. The helper looks at the classifications on the object and for the first match against a provided URI, outputs the value. This helper can be used if a field in your vendor extension requires a specific value which corresponds to a classification in WSRR. For example the following will output "Development" if the this WSRR object is classified by "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Development", or "Production" if the this WSRR object is classified by "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production":
```
{{classificationToValue this "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Development" "Development" "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production" "Production"}}
```
- stateToValue - for a WSRR object, is given a list of state URI to value. The helper looks at the state on the object and for the first match against a provided URI, outputs the value. This helper is useful for mapping the state of the service version to the API phase of Identified, Specified or Realized. For example the following will output "Realized" if the this WSRR object is in the state "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational", or "Identified" if the this WSRR object is in the state "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Identified":
```
{{stateToValue this "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational" "Realized" "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Identified" "Identified"}}
```

You can register more custom helpers for Handlebars in lib/templating.js and add them to the templates.

Finally if the above customization is insufficient, you can change the code to alter the processing to perform any filtering required. This can be done in the code itself. 

Note any change to the code is not supported.

##### Debugging filtering

For each version, the final data object is written to the directory "logs" and is called "wsrrdata.json". You can check that the data captured from WSRR was as expected. See "How the templates work and the object passed to them" for details of how the final data object is created from the filtered query results.

### Templates

Templates are stored in the templates directory. 

The supplied templates are overridden by adding an entry into the configuration properties file with name of the identifier of the template and the value of the path to the new template file. The path can be absolute and it is recommended to use an absolute path and locate your templates in a different directory than the tool. 

The following lists the template identifier, default file name in the templates folder and intention.

`template_SOAP` - soap.yaml - template for a SOAP API.

`template_REST` - rest.yaml - template for a REST API where there is no Swagger.

`template_REST_SWAGGER` - restSwagger.yaml - template for a REST API where there is a Swagger.

`template_PRODUCT_PER_VERSION` - productPerVersion.yaml - template for the product where the tool generates one product per service version.

`template_PRODUCT_WSDL` - productWsdl.yaml - template for the product where the tool generates for Mode 4.

`template_CONSUMERS_PER_VERSION` - consumersPerVersion.yaml - template for the consumers yaml where the tool generates one product per service version.

For example to override the SOAP API template with a file located in /tmp/soap.yaml, add the following entry to the configuration properties file:

`template_SOAP=/tmp/soap.yaml`

##### How the templates work and the object passed to them

For all WSRR modes (1 to 3) once the query step has been run for an individual service version, the data returned is filtered in the filtering step. This produces a final data object which represents the business service, service version, SLDs and endpoints which have been retrieved from WSRR and filtered.

The templates for the API and Product are then run. These templates are given the data object and are able, using the handlebars templating expressions, to take values from the data object and insert them into the yaml.

The structure of the object passed to the template has the business service as the top level object, with sub objects.

```
{
  bsrURI: string (bsrURI)
  type: string (SDO type)
  governanceRootBsrURI: string (bsrURI of governance root)
  primaryType: string (model type if a business model instance)
  state: string (URI of state)
  properties: 
  {
  	name: string (name)
  	description: string (description)
  	version: string (version)
  	.
  	.
  	.  
  }
  classifications: 
  [
  	classification URI string,
  	classification URI string,
  	.
  	.
  	.
  ]
  relationships: 
  {
  	RELATIONSHIP_NAME: 
  	[
  	  {
        bsrURI: string (bsrURI of a target)
        type: string (SDO type of target)
        primaryType: string (model type of target if a business model instance)
  	  }
  	  .
  	  .
  	  .
  	]
  	RELATIONSHIP_NAME:
  	[
  	...
  	]
  	.
  	.
  	.
  }
  version: object (the version object)
  versions: 
  [
  	object (the version object)
  ]
  consumers:
  [
    object (the consumer object)
  ]
}
```

Where `RELATIONSHIP_NAME` is the name of a relationship, for example "gep63_versions".

The version object is as below:

```
{
  bsrURI: string (bsrURI)
  type: string (SDO type)
  governanceRootBsrURI: string (bsrURI of governance root)
  primaryType: string (model type if a business model instance)
  state: string (URI of state)
  properties: 
  {
  	name: string (name)
  	description: string (description)
  	version: string (version)
  	.
  	.
  	.  
  }
  classifications: 
  [
  	classification URI string,
  	classification URI string,
  	.
  	.
  	.
  ]
  relationships: 
  {
  	RELATIONSHIP_NAME: 
  	[
  	  {
        bsrURI: string (bsrURI of a target)
        type: string (SDO type of target)
        primaryType: string (model type of target if a business model instance)
  	  }
  	  .
  	  .
  	  .
  	]
  	RELATIONSHIP_NAME:
  	[
  	...
  	]
  	.
  	.
  	.
  }
  slds:
  [
    object (an sld object)
    object (an sld object)
    .
    .
    .
  ]
  consumers:
  [
    object (a consumer)
  ]
}
```

The SLD object is as below:

```
{
  bsrURI: string (bsrURI)
  type: string (SDO type)
  governanceRootBsrURI: string (bsrURI of governance root)
  primaryType: string (model type if a business model instance)
  state: string (URI of state)
  properties: 
  {
  	name: string (name)
  	description: string (description)
  	version: string (version)
  	.
  	.
  	.  
  }
  classifications: 
  [
  	classification URI string,
  	classification URI string,
  	.
  	.
  	.
  ]
  relationships: 
  {
  	RELATIONSHIP_NAME: 
  	[
  	  {
        bsrURI: string (bsrURI of a target)
        type: string (SDO type of target)
        primaryType: string (model type of target if a business model instance)
  	  }
  	  .
  	  .
  	  .
  	]
  	RELATIONSHIP_NAME:
  	[
  	...
  	]
  	.
  	.
  	.
  }
  endpoints:
  [
  	object (an endpoint object)
  	object (an endpoint object)
  	.
  	.
  	.
  ]
  soapEndpoints:
  [
  	object (an endpoint object found with the SOAP endpoints query)
  	object (an endpoint object found with the SOAP endpoints query)
  	.
  	.
  	.
  ]
  restEndpoints:
  [
  	object (an endpoint object found with the REST endpoints query)
  	object (an endpoint object found with the REST endpoints query)
  	.
  	.
  	.
  ]
  consumers:
  [
    object (consumer object)
  ]
}
```

The consumer object is as below:
```
{
  sla: object (sla data object)
  version: object (consuming version data object)
  capability: object (consuming capability data object)
}
```

Each object in the consumer object is a WSRR data object with the metadata for that object. The "sla" object has data of the Service Level Agreement, the "version" object has data of the consuming version and the "capability" object has data of the consuming capability. The consuming version and consuming capability have a property "organization" added which is the WSRR data object for the owning organization for each.

However the consuming version and consuming capability objects do not have the detail of the business service and service version objects. They only have the metadata at the first level, they do not reference the child version or the child SLDs.  


##### The default product template

The default product template is "productPerVersion.yaml" and sets the following:

product name to the name of the service version, processed to be acceptable as an x-ibm-name. 
product title to the name of the service version
product version to the version of the service version
product description to the description of the business service
product contact name to the version owner
product contact email to the version owner email (if set) 

Visibility to publicly viewable, and subscription enabled but the user must be authenticated to subscribe. 

A single API is added the name of which in the product YAML is the name of the version, processed to be acceptable as an x-ibm-name. This references api.yaml as the definition file of the API.

For each SLD on the version, a plan entry is created. Each plan entry sets the following:

plan name to the name of the SLD, processed to be acceptable as an x-ibm-name.
plan title to the name of the SLD
plan description to the description of the SLD
plan included API to the name of the version, processed to be acceptable as an x-ibm-name.

Sign-up approval required is false, rate limit is 100 per hour with a soft limit.

Note: the plan definition specifies the API included in the plan, and in the template uses the name of the version. This must match the API definition, which in the template uses the name of the version. Otherwise the API will not be included in the plan. 


##### The default SOAP API template

The default SOAP API template is "soap.yaml" and sets the following:

API x-ibm-name to the version name, processed to be acceptable as an x-ibm-name.
API title to the version name.
API description to the version description.
API version to the version's version.
API contact name to the version owner.
API contact email to the version owner email, if set.
API base path to the path part of the name of the first production endpoint on the first SLD on the version.

The phase is set to "realized", an assembly is specified which proxies all requests to a URL which is the name of the first production endpoint on the first SLD on the version. 

The API has testable set to true and enforced set to true.


##### The default REST Swaggerless API template

The default REST Swaggerless API template is "rest.yaml" and sets the same properties as the SOAP template. The REST swaggerless template is used when no swagger document is found for the service. 

An assembly is specified which proxies all requests to a URL which is the name of the first production endpoint on the first SLD on the version. The only path that the API specifies is "/" because there is not information in WSRR which describes the REST API. 


##### The default REST with Swagger API template

The default REST with Swagger API template is "restSwagger.yaml" and sets the same properties as the SOAP template. The REST with Swagger template is used when a swagger document is found for the service. The first swagger document found is used. 

An assembly is specified which proxies all requests to a URL which is the name of the first production endpoint on the first SLD on the version. The details in the Swagger file is used to describe the paths of the REST API. 


##### The default consumers template

The default consumers template is "consumersPerVersion.yaml" and generates a yaml file which is for use by the tool itself. It sets the following:

- A list called "consumers" is created, which is either empty or populated if there are consumers on the capability.
 
For each SLD on the version, the consumers are examined. For each consumer object on the SLD a consumers entry is added in the file. This contains the following:

- consumer name to: `<name of consuming version> (<bsrURI of the consuming version>)`. This format is required because the tool need to be able to distinguish multiple WSRR applications with the same name. If you are sure that there are no duplicate consumer names then you can set this to just the name, or include the consumer version.
- description to the description of the consuming version
- clientID to the consumer identifier property on the consuming version
- duplicateClientID to the consumer identifier and context identifier property on the consuming SLA
- planName to the name of SLD, processed to be acceptable as an x-ibm-name. This must correspond to the name of the plan created in the product template for the SLD.

Note: the consumers definition specifies the plan name to subscribe to, and in the template uses the name of the SLD processed to be an x-ibm-name. This must match the product definition, which in the product template uses the name of the SLD processed to be an x-ibm-name. Otherwise the consumer does not specify a valid plan in the product. Also note the consumers definition specifies the product name as the name of the business service, processed to be an x-ibm-name. This must match the product definition, which in the product template uses the name of the business service, processed to be an x-ibm-name. Otherwise the consumer does not specify a valid product. The tool will validate the consumers yaml and will check that the plan names are defined on the product yaml that was created.


##### The WSDL product template

The default WSDL product template is "productWsdl.yaml". This is used for transfer mode 4 and the input object is the API Swagger. The template sets the following:

product name to the API info.title, processed to be acceptable as an x-ibm-name. 
product title to the API info.title
product version to the API info.version
product description to the API info.description
product contact name to the API info.contact.name

Visibility to publicly viewable, and subscription enabled but the user must be authenticated to subscribe. 

A single API is added the name of which in the product YAML is the API info.x-ibm-name name of the version. This references api.yaml as the definition file of the API.

A single plan is defined which sets the following:

plan name to the API info.x-ibm-name
plan title to "default"
plan included API to the API info.x-ibm-name

Sign-up approval required is false, rate limit is 100 per hour with a soft limit.


##### Sample Swagger extension template

In the `samples` directory the file `extensions.yaml` contains the template definition for two Swagger extensions; "x-wsrr-metadata" and "x-WSRRConsumers". If you add these definitions to an API template then when the API Swagger is created extra content will be added to the Swagger.

The Swagger extension "x-wsrr-metadata" is intended to demonstrate which metadata from WSRR can be written to the API definition. Such data will be shown in the developer Portal, and as such you may wish to use this during debugging, and then remove this section from the template for production use. Such data is also loaded into the DataPower gateway, and as such you may wish to remove this section to reduce the space your API definitions use on DataPower. 

The state, bsrURI, and properties of the business service are stored as "BS-bsrURI", "BS-state" and the property name prefixed by "BS-". 

The service version bsrURI, state and properties and classifications are stored as "SV-bsrURI", "SV-state" and the property name prefixed by "SV-". The classifications of the service version are stored as a list named "SV-classifications" and each entry is a classification URI.

The service version has a property "SLDs" which is a list of objects. Each object is a single SLD and has the bsrURI, state, properties and classifications of the SLD. Each SLD has a property "endpoints" which is a list of objects, each being a single endpoint and has the bsrURI, state, properties and classifications of the endpoint.

The "x-wsrr-metadata" Swagger extension does not have a corresponding API Connect extension schema definition. As such, it cannot be hidden from display in the developer portal and is for debugging purposes only.


The Swagger extension "x-WSRRConsumers" contains an entry for each consumer that is found for the version, with the details of the consuming capability name & description, consuming version name, description & version, consuming SLA name and the name of the SLD that was consumed. If you have loaded the sample vendor extension `wsrrConsumers.yaml` then the API designer will render the contents of this extension. This sample is contained in the "samples" directory of the tool installation.


##### Common template structures

Following are examples of common things in the templates.

The following shows how to put the value of the name property from the top level business service, into the title in the yaml.

`title: '{{properties.name}}'`

The result is:

`title: 'Stock Quote Service'`

The following shows how to put the value of the name property from the version object, into the title in the yaml.

`title: '{{version.properties.name}}'`

The result is:

`title: 'Stock Quote Service Version'`

The following shows how to loop over all the properties of the top level business service, and output the name of the property prefixed with "BS-" and the value of the property. 

```
{{#each properties}}
  BS-{{@key}}: '{{this}}'
{{/each}}
```

The result is:

```
  BS-bsrURI: aa867aaa-c596-46a4.83b5.affba8afb525
  BS-name: Basic Service
  BS-namespace: ''
  BS-version: ''
  BS-description: Basic service for testing
  BS-owner: admin
  BS-lastModified: '1463323309999'
  BS-creationTimestamp: '1462460017778'
  BS-lastModifiedBy: wasadmin
  BS-ale63_ownerEmail: owner@mail.ibm.com
  BS-ale63_guid: ''
  BS-ale63_assetType: ''
  BS-ale63_remoteState: ''
  BS-ale63_fullDescription: ''
  BS-ale63_assetOwners: ''
  BS-ale63_communityName: ''
  BS-ale63_requirementsLink: ''
  BS-ale63_assetWebLink: ''
```

The following shows how to check if there are any values in the classification array on the version. If there are values, the template creates a list called "SV-classifications" and outputs each classification as an entry. If there are not values, the template creates an empty list called "SV-classifications".

```
{{#if version.classifications}}  
  SV-classifications:
{{#each version.classifications}}
  - '{{this}}'
{{/each}}{{else}}
  SV-classifications: []
{{/if}}
```

The result is:

```
  SV-classifications:
    - 'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/BusinessDomain#AccountAdministration'
    - 'http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External'
```

Because the loop is over the classifications, "this" means each value of the classifications array on the versions object, which in the case of classifications is a string. The template outputs `{{this}}` which is the string of the classification URI.

The template also shows the use of if and else conditions.

The following shows how to use custom handlebars helpers. The following template uses the "multiline" helper that is available to process the description property of the version:

`description: "{{multiline version.properties.description}}"`

The result is:

```
  description: |-
    Stock Quote 2015
    Operations:
    GetStockQuote
    GetStockQuote_Json
    GetStockQuote_Xml
```

The following shows how to use the "apiName" helper to make a product name that is acceptable to API Connect, and concatenates multiple values to form the product name. This includes the string literal "Product":

`name: '{{apiName version.properties.name}}-{{apiName "Product"}}'`

The result is:

```
info:
  name: mathservice-product
```


##### Example template change - How to set the endpoint per catalog

The default API templates take the first production endpoint found on one of the SLDs as the back end URL. However you can instead set a different URL per Catalog and take the URLs from endpoints with different WSRR environment classifications. First change the assembly section to use a property:

```
  assembly:
    execute:
      -
        proxy:
          title: "proxy"
          target-url: '$(endpoint-url)' 
```

Then in the `x-ibm-configuration` section add a section which defines the property `endpoint-url`:

```
  properties:
    endpoint-url:
      value: ''
      description: ''
      encoded: false
  catalogs:
    Sandbox:
      properties:
        endpoint-url: '{{endpointNameByClassifications version.slds "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging"}}'
    Production:
      properties:
        endpoint-url: '{{endpointNameByClassifications version.slds "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"}}'
```

This sets the `endpoint-url` property (and therefore the back end URL) for the Sandbox Catalog to the first endpoint found which is classified by the WSRR environment `http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging`. This is the default WSRR Staging environment. APIs pushed to the Sandbox catalog will invoke this URL. The template then sets the `endpoint-url` property for the Production catalog to the first endpoint found which is classified by the WSRR environment `http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production`.  This is the default WSRR Production environment.

You can adjust the names of the catalogs to match those in your API Connect cloud and the WSRR environments to match those in your WSRR.

##### Example template change - How to set a non-APIC Gateway enforced API host for Swagger based Rest APIs

The default restSwagger.yaml populates the "host" value with '$(catalog.host)'. This tells APIC that the gateway server for the catalog is to be used as the host address. This means any host obtained from a downloaded Swagger file is not pushed into APIC. If the API is not to be managed by the APIC gateway and is supposed to use the host from the downloaded Swagger file.
`host: '$(catalog.host)'`
Must be removed from the template and then this will allow the host from the Swagger file to be used instead.


##### Debugging templating errors

YAML as a language is sensitive to the spaces and positioning. The level of YAML supported is 1.2. 

The template substitution process begins with taking the template and the data object and using them to create a YAML string. For each version, the data object is written to the directory "logs" and is called "wsrrdata.json". You can check that your template specified data that exists on the data object using this.

The template substitution process then parses the YAML string into an object. If the YAML string is not valid then the tool will output an error detailing where in the YAML string the error is. The YAML string is written to the directory "logs" and is called "apiFromTemplate.yaml" if creating an API YAML or "productFromTemplate.yaml" if creating a product YAML. The error is also written to the file "result.json" in the diagnostics section. This step is done to ensure that the YAML generated from the template is valid. 

If the template substitution process is creating the API YAML, it then stores the resulting object as a YAML file, in the directory "logs" called "wsrr.yaml". If creating the product YAML it stores the resulting object as a YAML file, in the service version directory called "product.yaml". There should not be errors at this point. 

For a SOAP API, the template substitution process then uses the WSDL files (stored as a ZIP) to generate an API definition for the WSDL API using the API Connect Toolkit, by executing the command `apic create --type api --wsdl ZIP_PATH`. ZIP_PATH is the path to the ZIP file containing the WSDL and XSD files for the service. The WSDL YAML file is stored in the "logs" directory and called "wsdl.yaml". If the API Connect command fails then the tool will output an error detailing the result of the API Connect Toolkit command. The error is also written to the file "result.json" in the diagnostics section. You can re-run the API Connect Toolkit command manually from the command line to reproduce the error and further debug the problem. 

For a SOAP API, the template substitution process then loads back in both the object and the WSDL YAML files, parses them into objects and combines them, with the object YAML data taking precedence. The combined object is then converted into YAML and stored in the service version directory as "api.yaml". There should not be errors at this point.

For a REST API, if a Swagger document is found, the template substitution process loads in and parses the Swagger document downloaded from WSRR to ensure it is valid. The object and the Swagger file content is then combined, with the object YAML data taking precedence. The combined object is then converted into YAML and stored in the service version directory as "api.yaml". There should not be errors at this point.


##### A note on combining YAML from WSDL YAML and SOAP template YAML

The tool uses the API Connect Toolkit to generate the YAML representation of the WSDL and XSD for a SOAP service.

The SOAP API template is used to generate the API definition YAML which overwrites parts of the WSDL YAML that is created by the API Connect Toolkit.

It may be that in future the default YAML that is generated by the API Connect Toolkit changes, and the SOAP API template must be adjusted to compensate. For example, the WSDL YAML contains a proxy assembly which invokes an endpoint in the WSDL. The SOAP API template contains an identical proxy which invokes an endpoint from WSRR. Therefore during the combination process the proxy assembly from the WSDL YAML is overwritten by the proxy assembly from the SOAP API template.  


### API Connect Toolkit commands

When pushing Products and APIs to API Connect, the "apic" command is used. The API Connect Toolkit should be installed and the "apic" command should be on the path. If "apic" is not on the path, then the tool will indicate an error. The error is also written to the file "result.json" in the diagnostics section. 

##### Debugging API Connect Toolkit command errors

Generally if the API Connect Toolkit command fails, the error will display the command which was run. For example:

```
2016-07-06 11:42:47: APIC toolkit command executed:
2016-07-06 11:42:47: Error: Command failed: C:\windows\system32\cmd.exe /s /c "apic create --type api --wsdl "./flowTestOutput/bdeefabd-6b47-47bd.becc.02986702cc82/545cc554-8b5c-4c13.9910.18e54218108d/545cc554-8b5c-4c13.9910.18e54218108d_wsdls.zip""
```
The commands are executed from the current command line directory. You can re-run the command from the command line to reproduce the problem.

If the error says:

`2016-07-06 11:42:47: ERROR Could not process the API request. See the server log for more information, or contact your administrator.`

Then the API Connect management server rejected the API Connect Toolkit call. Refer to the preceding API Connect Toolkit command and see the management server log for more details of the error.


### Consumers created

The consumers that are created are those listed in the consumers.yaml file. This is created by querying WSRR for consumers, and by default the tool query "ConsumingVersionsForSLA" will check that the owning organization of the consuming service version is that configured in the properties file as "wsrrOrg". Therefore only consumers in the same organization that is transferred will be created.

The API Connect developer organization user credentials configured in the properties file are used to log into all developer organizations, therefore that user should have access to all Catalogs and developer organizations.

#### The Application name and duplicate WSRR consumers

The values which appear as the Application name and description are determined by the consumers template file. By default, the name of the Application is set to the consuming version name plus the consuming version bsrURI. 

The tool will check for an existing Application with the required name before creating a new Application. If the tool finds an existing Application then this Application will be subscribed to the Product being processed, and updated with the consumer description and API key. Therefore if you have duplicate consumer names in WSRR, the tool needs to be able to distinguish the WSRR consumers, otherwise the tool will combine these duplicate consumers into a single Application, which is not desirable.

Therefore a naming scheme for the Application must be in the consumers template that guarantees that WSRR consumers are not accidentally combined into the same Application. The default uses the WSRR version name and bsrURI and as such is guaranteed to be unique, even if the name of the consumer is the same. If your WSRR consumers have a unique name and version, then you can change the consumers template to use the version name and version as the consumer name. 


## Reviewing logs

To produce a more readable format for the logs the tool provides a facility to process the logs and either view in the console or produce a processed file. Both forms produce a JSON style output. though the output is not completely valid JSON.

### Review logs from ${home}/.soatt/logs directory

Running `soatt -l` will enable the continued reviewing and processing ability over the primary log directory of the tool.

When run, the tool will present an ordered list of the files that are in the directory and allow the selection of one for review.
e.g.
```
1. soatt.1.log
2. soatt.2.log
3. soatt.3.log
4. soatt.4.log
5. soatt.5.log
```
By entering the number of the log file you wish to review, you go to a second prompt

When in this menu you can exit by entering 0

The second prompt asks if the file is to processed for viewing in the console or saved to a new log file.

After the selection has been made, you will be returned to the menu displaying the list of log files. 

### Review logs from different directory
If a file is specified after the -l the tool will only attempt to process that file. that file can either be in the ${home}/.soatt/logs/ directory or elsewhere. When the command is given a prompt will be given asking whether the processed file should be displayed in the console or saved to a file. Once the option is selected the tool with exit.

The tool currently only supports a single file being processed this way so individual runs will be required.

### Stored Processed logs
All processed log file are stored in ${home}/.soatt/logs/processed.


## Provided modules

The Transfer Tool exports the following modules:

- wsrrUtils - the module for communicating with WSRR
- apimcli - the module for invoking some API Connect Toolkit commands
- apimdevportal - the module for communicating with the API Connect Portal APIs
- logger - the module for logging to console, and tracing entry, exit and debug messages

These modules are used by the tool to perform its functions. They are exported for re-use. 

The modules use Promises to do asynchronous work and will return a Promise when an async operation is performed. 


### wsrrUtils

The implementation of the module is in `lib/WSRR/wsrrUtils.js`.

To use first call `setWSRRConnectiondetails(inputOptions)` with inputOptions being an object containing keys and values to configure the library. These keys are exactly what are used in the connection configuration properties file. The function returns immediately.

Once initialized the module can be used to:
- get the WSRR version
- test the WSRR connection
- run a Graph Query at depth 1
- run a Property Query
- run a Named Query
- download binary content
- retrieve metadata using a bsrURI
- validate a bsrURI
 
A number of functions are provided which use the above to provide functions to:
- download all WSDL and XSD for a service version
- download all documents on the artifact relationship for a service version or business service
- download all charter documents for a business service
 
Refer to the module for details.


### apimcli

The implementation of the module is in `lib/apimcli.js`.

To use first call `setConnectionDetails(inputOptions, true/false)` with inputOptions being an object containing keys and values to configure the library. These keys are exactly what are used in the connection configuration properties file for the API Connect API Manager. The function returns a Promise which resolves with nothing when the details are set. If the second parameter is true or undefined the function will log into API Connect.

The module calls the `apic` command on the command line, and as such requires `apiconnect` to be npm installed globally.

Once initialized the module can be used to:
- get the version
- validate a product or API
- push a product or API to drafts
- create an API from a WSDL
- stage a product to a catalog
- publish a product to a catalog
- publish a product in drafts to a catalog
- set a product in a catalog state to various values (for example retired)
- delete a product from a catalog 

Refer to the module for details.


### apimdevportal

The implementation of the module is in `lib/apimdevportal.js`.

To use first call `setConnectionDetails(inputOptions)` with inputOptions being an object containing keys and values to configure the library. These keys are exactly what are used in the connection configuration properties file for the API Connect Developer Portal. The function returns immediately. 

The provider organization and catalog identified in `apiIdentifier` are used on all calls. These are the provider org and catalog which all calls apply to. You can change the catalog used by calling `setCatalog()`. The developer organization ID is provided on all calls as a parameter which specifies which developer organization the calls apply to. 

Typically you would first get the ID of the developer organization that is set, for use in all subsequent function calls.

Once initialized the module can be used to:
- set the catalog to use on subsequent API calls
- set the display name of the developer organization to use
- get the ID of the developer organization that is set on the module
- list developer organizations
- get the ID of the developer organization provided
- list Applications in the catalog
- retrieve an Application by name
- delete an Application
- subscribe an Application to a plan and product using the product name
- subscribe an Application to a plan and product using the product ID
- update the API key of an Application
- update the description of an Application
- list the subscriptions of an Application
- unsubscribe an Application from a plan and product
- list the subscribing Applications of a product
- list the products
- retrieve a product by name and version

Refer to the module for details.


### logger

The logger module provides logging and is used by the other libraries. If the logger is not initialized then no logging of errors to the console will happen.

To use first call `initialize` supplying a callback which is called once the logger is ready. The initialize method will load the messages and create the directory where the logs are placed, in the user home directory under `/.soatt/logs`.


## Developing

### Nodeclipse

We use Nodeclipse to develop against. If you wish to do so, import the project contained in `wsrr2apic` as an existing project.

Ensure to make the following settings in Nodeclipse:

- Window -> Preferences -> Team -> Git -> Configuration -> System Settings -> autocrlf = false
- Window -> Preferences -> General -> Workspace -> Text File Encoding = Other (UTF-8)
- Window -> Preferences -> General -> Workspace -> New Text File Delimiter = Other (Unix)


### Tests

Tests use Mocha and Chai. 

Unit tests are run using "npm test". These only use memory to run and need nothing external.

FVT tests are described below. Run them from the main directory (above /tests).

File system FVT tests are described (in Mocha) as "*fsfvttests" and are run using "npm run-script fsfvt". These rely upon only the file system and will create their own test folders and should clean them up afterward.

WSRR FVT tests are described as "*wsrrfvttests" and use a yakbak proxy which simulates a WSRR system set up with the test data. These are run using "npm run-script wsrrfvt". The WSRR server details must match those used when the tapes were recorded, which were username "user" and password "user", server "srb84a.hursley.ibm.com", port 9443 and protocol "https".

CI tests are a combination of unit tests, file system tests and WSRR tests, and are run using "npm run-script ciTests".

APIC CLI FVT tests are described as "*apimfvttests" and require a test API Connect system set up and configured in the 
connectionproperties.properties file. These are run using "npm run-script apicfvt".

APIC Developer Portal API FVT tests are described as "*apimdevportal_fvttests" and require a test API Connect system set up and configured in the connectionproperties.properties file. These are run using "npm run-script apicdpfvt". These tests require that a product named "basic-service" with version "1.0" is published to the catalog specified in the connectionproperties.properties file.

There is a script which runs all of the above FVT tests which can be run using "npm run-script allfvt".

## License

The project uses the Apache License Version 2.0 software license. See [LICENSE.txt](LICENSE.txt).

