package com.akkyomap.backend.global.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void publicPlaceListIsAccessibleWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/places"))
            .andExpect(status().isOk());
    }

    @Test
    void myPlaceListRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/places/me"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    void adminApiRejectsUserRole() throws Exception {
        mockMvc.perform(get("/api/admin/places/pending").with(csrf()))
            .andExpect(status().isForbidden());
    }
}
