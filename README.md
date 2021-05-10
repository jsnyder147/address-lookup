# Custom Google Maps Address Lookup LWC

This component will bring the native Address Lookup functionality found on Standard Address fields to Lightning Communities, as well as any other custom address implementations.

## Usage

- Set up the Google_Maps_API_Configuration.Google_Maps_Configuration Custom Metadata Record with your key from Google Maps API
- Verify that the Google Maps API Remote Site Setting is in place for callouts to the Google Maps API
- Add the addressLookup component to your LWC or Aura Component:
    - <c-address-lookup onaddressselected={handleAddressSelected}>
    - The component has one event that will need to be handled, addressselected as shown above.
    - The object returned can be accessed in your handler by referencing event.detail.address
    - Fields include: streetNumber, route, street, city, state, country, postalCode, postalCodeSuffix
- Use the exampleImplementation LWC for a refernce on how to setup the component.

## Considerations

- This unmanaged package will work properly in any org, however if the intent is to use this in a managed package, some changes should be made.
- Managed Packaged Security Review will flag the use of Cusotm Metadata Types for storage of Tokens/Keys.
- In order to pass the Security Review, the Custom Metadata Types should be converted to a Named Credential, and the logic in the AddressLookupController Apex Class should be updated to reference the Named Credential for the callouts instead of the Custom Metadata.
