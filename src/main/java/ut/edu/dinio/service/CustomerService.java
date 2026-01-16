package ut.edu.dinio.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.repositories.CustomerRepository;

@Service
public class CustomerService implements UserDetailsService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        Optional<Customer> customerOpt = customerRepository.findByEmail(identifier);
        
        if (customerOpt.isEmpty()) 
            customerOpt = customerRepository.findByPhone(identifier);
        
        if (customerOpt.isEmpty()) 
            throw new UsernameNotFoundException("User not found with identifier: " + identifier);
        
        Customer customer = customerOpt.get();

        return User.builder().username(customer.getEmail()).password(customer.getPasswordHash()).roles("USER").build();
    }

    public Customer login(String identifier, String rawPassword) {
        Optional<Customer> customerOpt;

        if (identifier.contains("@")) {
            customerOpt = customerRepository.findByEmail(identifier);
        } else {
            customerOpt = customerRepository.findByPhone(identifier);
        }

        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            if (passwordEncoder.matches(rawPassword, customer.getPasswordHash())) {
                return customer;
            }
        }
        return null;
    }

    public String registerCustomer(String fullName, String identifier, String password) {
        if (customerRepository.findByIdentifier(identifier).isPresent()) {
            return "Tài khoản (Email hoặc Số điện thoại) đã tồn tại!";
        }

        Customer customer = new Customer();
        customer.setFullName(fullName);
        
        if (identifier.contains("@")) {
            customer.setEmail(identifier);
            customer.setPhone("N/A"); 
        } else {
            customer.setPhone(identifier);
        }
        
        customer.setPasswordHash(passwordEncoder.encode(password));
        customer.setCreatedAt(LocalDateTime.now());

        customerRepository.save(customer);
        return "success";
    }

    public Customer findByEmail(String email) {
        return customerRepository.findByEmail(email).orElse(null);
    }

    public void save(Customer customer) {
        customerRepository.save(customer);
    }

    public void updatePassword(Customer customer, String newRawPassword) {
        customer.setPasswordHash(passwordEncoder.encode(newRawPassword));
        customerRepository.save(customer);
    }
}