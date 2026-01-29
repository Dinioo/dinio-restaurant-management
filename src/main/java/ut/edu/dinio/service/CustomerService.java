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
import org.springframework.web.multipart.MultipartFile;

import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.repositories.CustomerRepository;

@Service
public class CustomerService implements UserDetailsService {

    @Autowired
    private CloudinaryStorageService cloudinaryStorageService;

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
        customer.setAddress("N/A");

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

    public Customer updateProfile(Integer id, String fullName, String phone) {
        Customer c = getById(id);
        if (c != null) {
            c.setFullName(fullName);
            c.setPhone(phone);
            return customerRepository.save(c);
        }
        return null;
    }

    public String updatePassword(Integer id, String oldPwd, String newPwd) {
        Customer c = getById(id);
        if (c == null)
            return "Người dùng không tồn tại";
        if (!passwordEncoder.matches(oldPwd, c.getPasswordHash())) {
            return "Mật khẩu hiện tại không đúng";
        }
        c.setPasswordHash(passwordEncoder.encode(newPwd));
        customerRepository.save(c);
        return "success";
    }

    public String updateEmail(Integer id, String newEmail, String password) {
        Customer c = getById(id);
        if (c == null)
            return "Người dùng không tồn tại";

        if (!passwordEncoder.matches(password, c.getPasswordHash())) {
            return "Xác nhận mật khẩu không chính xác";
        }

        Optional<Customer> existing = customerRepository.findByEmail(newEmail);
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            return "Email này đã được đăng ký bởi tài khoản khác";
        }

        c.setEmail(newEmail);
        customerRepository.save(c);
        return "success";
    }

    public Customer updateAvatar(Integer id, MultipartFile avatarFile) {
        Customer c = getById(id);
        if (c == null)
            return null;

        if (avatarFile == null || avatarFile.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ảnh.");
        }

        String contentType = avatarFile.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File không phải ảnh.");
        }

        String avatarUrl = cloudinaryStorageService.uploadImage(avatarFile, "dinio/avatars");
        c.setImageUrl(avatarUrl);
        return customerRepository.save(c);
    }

    public Customer getById(Integer id) {
        return customerRepository.findById(id).orElse(null);
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