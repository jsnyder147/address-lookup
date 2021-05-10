@isTest
public without sharing class AddressLookupControllerTest {
    @isTest
    static void testGetSuggestions(){
        Test.setMock(HttpCalloutMock.class, new AddressLookupControllerMock());
        String response = AddressLookupController.getSuggestions('123 Test', '1.1', '1.1');
        String response2 = AddressLookupController.getPlaceDetails('123');
    }

}
