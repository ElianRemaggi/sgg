package com.sgg.identity.service;

import com.sgg.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsernameGenerator {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public String generateFromEmail(String email) {
        String prefix = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        String base = normalize(prefix);

        String candidate = base;
        int suffix = 2;
        while (userRepository.existsByUsername(candidate)) {
            String suffixStr = String.valueOf(suffix);
            if (base.length() + suffixStr.length() > 30) {
                candidate = base.substring(0, 30 - suffixStr.length()) + suffixStr;
            } else {
                candidate = base + suffixStr;
            }
            suffix++;
        }
        return candidate;
    }

    private String normalize(String prefix) {
        String lower = prefix.toLowerCase();
        String clean = lower.replaceAll("[^a-z0-9_]", "_");
        String padded = clean.length() < 3 ? padRight(clean, 3, '_') : clean;
        return padded.length() > 30 ? padded.substring(0, 30) : padded;
    }

    private String padRight(String s, int length, char pad) {
        StringBuilder sb = new StringBuilder(s);
        while (sb.length() < length) {
            sb.append(pad);
        }
        return sb.toString();
    }
}
