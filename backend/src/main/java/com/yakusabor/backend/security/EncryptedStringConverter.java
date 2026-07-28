package com.yakusabor.backend.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Converter
@Component
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private static EncryptionUtil encryptionUtil;

    @Autowired
    public void init(EncryptionUtil encryptionUtil) {
        EncryptedStringConverter.encryptionUtil = encryptionUtil;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return encryptionUtil == null ? attribute : encryptionUtil.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return encryptionUtil == null ? dbData : encryptionUtil.decrypt(dbData);
    }
}