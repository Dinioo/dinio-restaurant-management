package ut.edu.dinio.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cloudinary.Cloudinary;

@Configuration
public class CloudinaryConfig {

  @Value("${cloudinary.cloud_name:dummy}")
  private String cloudName;

  @Value("${cloudinary.api_key:dummy}")
  private String apiKey;

  @Value("${cloudinary.api_secret:dummy}")
  private String apiSecret;

  @Bean
  public Cloudinary cloudinary() {
    Map<String, String> cfg = new HashMap<>();
    cfg.put("cloud_name", cloudName);
    cfg.put("api_key", apiKey);
    cfg.put("api_secret", apiSecret);
    return new Cloudinary(cfg);
  }
}
