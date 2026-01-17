package ut.edu.dinio.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.pojo.enums.ReservationStatus;
import ut.edu.dinio.repositories.ReservationRepository;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    public List<Reservation> getReservationsByCustomer(Integer customerId) {
        return reservationRepository.findByCustomerIdOrderByReservedAtDesc(customerId);
    }
    
    public String cancelReservation(Integer reservationId, Customer currentUser) {
        Optional<Reservation> resOpt = reservationRepository.findById(reservationId);

        if (resOpt.isEmpty()) {
            return "Không tìm thấy đơn đặt bàn!";
        }

        Reservation res = resOpt.get();

        if (!res.getCustomer().getId().equals(currentUser.getId())) {
            return "Bạn không có quyền hủy đơn này!";
        }

        if (res.getStatus() == ReservationStatus.CANCELLED) {
            return "Đơn này đã bị hủy trước đó!";
        }
        
        if (res.getStatus() == ReservationStatus.COMPLETED) {
            return "Đơn hàng đã hoàn thành, không thể hủy!";
        }

        res.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(res);
        
        return "success";
    }
}