package ut.edu.dinio.service;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;

@Service
public class CloudinaryStorageService {

  private final Cloudinary cloudinary;

  public CloudinaryStorageService(Cloudinary cloudinary) {
    this.cloudinary = cloudinary;
  }

  /**
   * Upload ảnh lên Cloudinary và trả về secure_url.
   */
  public String uploadImage(MultipartFile file, String folder) {
    if (file == null || file.isEmpty()) {
      throw new IllegalArgumentException("Image file is empty");
    }

    try {
      String publicId = UUID.randomUUID().toString();

      @SuppressWarnings("unchecked")
      Map<String, Object> res = cloudinary.uploader().upload(
          file.getBytes(),
          Map.of(
              "folder", folder == null ? "dinio/menu" : folder,
              "public_id", publicId,
              "resource_type", "image"
          )
      );

      Object secureUrl = res.get("secure_url");
      if (secureUrl == null) {
        throw new RuntimeException("Cloudinary response missing secure_url");
      }
      return secureUrl.toString();

    } catch (IOException e) {
      throw new RuntimeException("Upload to Cloudinary failed", e);
    }
  }
}
