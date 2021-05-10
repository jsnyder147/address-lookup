@isTest
public without sharing class AddressLookupControllerMock implements HttpCalloutMock {
    
    public HTTPResponse respond(HTTPRequest req){
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setBody('Success');
        res.setStatusCode(200);
        return res;
    }
}
