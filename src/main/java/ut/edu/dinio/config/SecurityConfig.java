package ut.edu.dinio.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import ut.edu.dinio.service.CustomOAuth2UserService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CustomOAuth2UserService customOAuth2UserService;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    @Order(1)
    public SecurityFilterChain staffSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/waiter/**", "/admin/**", "/kitchen/**", "/cashier/**", "/staff/**", "/api/tables/**", "/api/reservations/**", "/assets/**", "/favicon.ico", "/error")
            .securityContext(context -> context.securityContextRepository(securityContextRepository()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/staff/login", "/assets/**", "/favicon.ico").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/waiter/**").hasAnyRole("WAITER", "ADMIN")
                .requestMatchers("/kitchen/**").hasAnyRole("KITCHEN", "ADMIN")
                .requestMatchers("/cashier/**").hasAnyRole("CASHIER_MANAGER", "ADMIN")
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/staff/login")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/staff/logout")
                .logoutSuccessUrl("/staff/login?logout")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            );
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityContext(context -> context
                .securityContextRepository(securityContextRepository())
            )
            .authorizeHttpRequests(req -> req
                .requestMatchers("/assets/**", "/favicon.ico", "/error").permitAll()

                .requestMatchers("/admin/**").hasRole("ADMIN")

                .requestMatchers("/profile/**", "/account/**", "/order-history/**").authenticated()

                .anyRequest().permitAll()
            )

            .formLogin(form -> form
                .loginPage("/login")
                .usernameParameter("identifier")
                .passwordParameter("password")
                .defaultSuccessUrl("/", true)

                .loginProcessingUrl("/fake_login_process")
                .permitAll()
            )

            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService))
                .defaultSuccessUrl("/", true)
            )

            .logout(logout -> logout
                .logoutUrl("/logout") 
                .logoutSuccessUrl("/login?logout") 
                .invalidateHttpSession(true) 
                .clearAuthentication(true) 
                .deleteCookies("JSESSIONID") 
                .permitAll()
            );

        return http.build();
    }

    @Bean
    public AuthenticationSuccessHandler staffSuccessHandler() {
        return (request, response, authentication) -> {
            var roles = org.springframework.security.core.authority.AuthorityUtils.authorityListToSet(authentication.getAuthorities());
            String cp = request.getContextPath();
            if (roles.contains("ROLE_ADMIN")) response.sendRedirect(cp + "/admin/dashboard");
            else if (roles.contains("ROLE_WAITER")) response.sendRedirect(cp + "/waiter/dashboard");
            else if (roles.contains("ROLE_KITCHEN")) response.sendRedirect(cp + "/kitchen/orders");
            else if (roles.contains("ROLE_CASHIER_MANAGER")) response.sendRedirect(cp + "/cashier/orders");
            else response.sendRedirect(cp + "/staff/login");
        };
    }
}
