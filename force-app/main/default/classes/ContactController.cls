public with sharing class ContactController {
    public ContactController() {

    }
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts() {
        //return [SELECT FirstName, LastName, Email FROM Contact LIMIT 10];
        throw new AuraHandledException('Forced error');
    }
}