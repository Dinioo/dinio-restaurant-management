package ut.edu.dinio.service;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class NotificationSseService {
    private final Map<Integer, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Integer userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.put(userId, emitter);
        
        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError((e) -> emitters.remove(userId));
        
        return emitter;
    }

    public void sendRealtime(Integer userId, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("DINIO_NOTIFY")
                        .data(data, MediaType.APPLICATION_JSON));
            } catch (IOException e) {
                emitters.remove(userId);
            }
        }
    }
}