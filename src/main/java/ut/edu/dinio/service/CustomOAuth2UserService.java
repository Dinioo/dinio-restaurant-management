package ut.edu.dinio.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpSession;
import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.repositories.CustomerRepository;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private HttpSession session;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        
        String provider = userRequest.getClientRegistration().getRegistrationId(); 
        
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");

        if ("facebook".equals(provider) && email == null) {
            String fbId = oauth2User.getAttribute("id");
            email = fbId + "@facebook.com"; 
            if (name == null) name = "Facebook User";
        }

        Optional<Customer> customerOpt = customerRepository.findByEmail(email);

        if (customerOpt.isEmpty()) {
            Customer newCustomer = new Customer();
            newCustomer.setEmail(email);
            newCustomer.setFullName(name);
            newCustomer.setPhone(provider.toUpperCase() + "_ACCOUNT"); 
            newCustomer.setPasswordHash("$2a$10$DUMMYPASSWORD_DO_NOT_USE"); 
            customerRepository.save(newCustomer);
            session.setAttribute("currentUser", newCustomer);
        } else {
            Customer existingCustomer = customerOpt.get();
            existingCustomer.setFullName(name);
            customerRepository.save(existingCustomer);
            session.setAttribute("currentUser", existingCustomer);
        }

        return oauth2User;
    }
}