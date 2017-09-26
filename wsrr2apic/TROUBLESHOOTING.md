# apiconnect-soa-transfer-tool

IBM Service Oriented Architecture Transfer Tool.  

# troubleshooting
This document will cover certain known issues that can be encountered when running the tool.

## Archive does not contain file AccountCreation.svc?xsd=xsd0
If when running the `apic create --type api --wsdl "<Service Version bsrURI>.zip` an error is thrown similar to `Error: Archive does not contain file: AccountCreation.svc?xsd=xsd0`.
the following steps must be taken.
1. Review the contents of the zip file in the output directory, checking that the missing file is actually missing.
	a. If a number of file names are in the form of bsrURIs, this means that there are multiple imports where the name of the file is identical to others that have been downloaded, so their bsrURI is used to ensure uniqueness
	b. If there are no file names with bsrURIs, then the file is not linked in a way that the Xpath can retreive. This will require a change to the Xpath and no further diagnosis steps are required 
	NOTE: Due to file naming requirements for particular OSs and APIC toolkit any special character for example ?/\ will be replaced with '.'. and all WSDL and XSD files will end in .wsdl or .xsd to be correctly detected by the APIC toolkit. This will mean exact matches are not possible between the zip and WSRR.
2. Review the WSDLs and XSDs to determine which file is attempting to IMPORT or INCLUDE the schema.
3. Check in WSRR that the expected file is correctly referenced by the importing document
4. If the importing/including file is an XSD style document(typically either .xsd or .svc) and that the files downloaded are using bsrURIs instead of 

If it is determined that the failing import or exclude and it is an XSD type document and that the relationships in WSRR between the Schema documents is correct. You need to raise a PMR against WSRR to obtain a WSRR iFix containing APAR IV96369. The APAR resolves a issue where XSD documents importing other XSD documents do not change the name of the imported file to be the bsrURI of the imported document, preventing the tool from being able to perform necessary linking operations. 
