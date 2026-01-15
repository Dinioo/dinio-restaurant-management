package ut.edu.dinio.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

import org.springframework.security.web.SecurityFilterChain;

import ut.edu.dinio.service.CustomOAuth2UserService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CustomOAuth2UserService customOAuth2UserService;

    // Nếu bạn không dùng AuthenticationManager thì có thể xoá bean này
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(req -> req
                // ✅ STATIC FILES
                .requestMatchers("/assets/**", "/favicon.ico", "/error").permitAll()

                // ✅ quyền admin
                .requestMatchers("/admin/**").hasRole("ADMIN")

                // ✅ cần đăng nhập
                .requestMatchers("/profile/**", "/account/**", "/order-history/**").authenticated()

                // ✅ còn lại public
                .anyRequest().permitAll()
            )

            .formLogin(form -> form
                .loginPage("/login")
                .usernameParameter("identifier")
                .passwordParameter("password")
                .defaultSuccessUrl("/", true)

                // ⚠️ Nếu bạn đang login bằng controller POST /login (fetch)
                // thì Spring Security KHÔNG xử lý endpoint này.
                // Nếu muốn Spring Security xử lý login: đổi thành .loginProcessingUrl("/login")
                .loginProcessingUrl("/fake_login_process")
                .permitAll()
            )

            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                .defaultSuccessUrl("/", true)
            )

            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout")
                .permitAll()
            );

        return http.build();
    }
}
