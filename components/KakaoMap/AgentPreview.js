import { motion, AnimatePresence } from "framer-motion";
import { Building, Home } from "lucide-react";

const AgentPreview = ({ agent, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute left-0 top-0 -translate-y-full -translate-x-1/2 z-50"
        >
          <div className="bg-white shadow-lg rounded-lg p-4 w-64">
            {/* 프로필 헤더 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                {agent.user.profileImage && (
                  <img
                    src={agent.user.profileImage}
                    alt={agent.user.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {agent.user.name}
                </h3>
                <p className="text-sm text-gray-500">{agent.officeName}</p>
              </div>
            </div>

            {/* 매물 정보 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Home className="w-4 h-4" />
                <span>등록 매물 {agent._count.properties}개</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="w-4 h-4" />
                <span>{agent.officeAddress}</span>
              </div>
            </div>

            {/* 꼬리표 */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white transform rotate-45" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgentPreview;
