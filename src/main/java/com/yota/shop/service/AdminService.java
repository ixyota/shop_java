package com.yota.shop.service;

import com.yota.shop.model.Admin;
import com.yota.shop.repository.AdminRepository;
import org.springframework.stereotype.Service;

@Service
public class AdminService {
    private final AdminRepository adminRepository;

    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    public boolean authenticate(String username, String password) {
        return adminRepository.findByUsername(username)
                .map(admin -> admin.getPassword().equals(password))
                .orElse(false);
    }
}

