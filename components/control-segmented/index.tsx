import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import { Command, userDefaultEvent } from '@/constants/command';
import useStore from '@/store';
import { DIRECTION, ROBOT_CURRENT_MODE, ROBOT_WORK_MODE } from '@/types';
import eventBus from '@/utils/eventBus';
import { sendCmdDispatch, sendCmdWithRepeat } from '@/utils/helper';
import { useEffect } from 'react';
// 控制分段按钮组件 - 切换工作模式
export const ControlSegmented = () => {
  //全局状态库中获取机器人状态
  const { robotStatus, setRobotStatus } = useStore((state) => state);
  const { t } = useTranslation();
  //4.17新增：监听机器人当前模式的变化，打印日志

  //console.log('[ControlSegmented] robotStatus.currentMode ->', robotStatus.currentMode);

  const sendCmd = (mode: ROBOT_CURRENT_MODE) => {
    // 如果当前工作模式与目标模式相同，不发送指令
    // if (robotStatus.currentMode === mode) {
    //   return;
    //}
    // 如果切换到锁止模式 - 重复发送2次，间隔30ms，确保锁止生效
    if (mode === ROBOT_CURRENT_MODE.LOCKED) {
      sendCmdWithRepeat(
        () => {
          sendCmdDispatch(Command.lockUp);
        },
        2,
        30
      );
    } else if (mode === ROBOT_CURRENT_MODE.MANUAL) {
      sendCmdWithRepeat(
        () => {
          sendCmdDispatch(Command.manualModel);
        },
        3,
        30
      );
    } else if (mode === ROBOT_CURRENT_MODE.AUTO) {
      sendCmdWithRepeat(
        () => {
          sendCmdDispatch(Command.autoModel);
        },
        3,
        30
      );
      // 进入自动模式后的特殊动作：通过事件总线发布一个默认移动方向：UP+LEFT
      eventBus.publish(userDefaultEvent.DIRECITON_CHANGE, {
        leftOrRight: DIRECTION.LEFT,
        forwardOrBackward: DIRECTION.UP,
      });
      //进入自动模式后，默认设为“不绑扎，只移动”状态   改FULL_BINDING？原先是without_binding
      setRobotStatus({
        currentBindingMode: ROBOT_WORK_MODE.FULL_BINDING,
      });
    }
  };

  // const sendAutoCmdInit = useCallback(() => {
  //   const commands = [
  //     Command.noLashed,
  //     Command.LeftChange,
  //     Command.goForwardInAutoMode,
  //     Command.EndAutoMode,
  //   ];

  //   setRobotStatus({
  //     currentBindingMode: ROBOT_WORK_MODE.WITHOUT_BINDING,
  //   });

  //   // 只在首次进入自动模式时设置默认方向，不要强制重置用户已选择的方向
  //   eventBus.publish(userDefaultEvent.DIRECITON_CHANGE, {
  //     leftOrRight: DIRECTION.LEFT,
  //     forwardOrBackward: DIRECTION.UP,
  //   });

  //   // 使用requestAnimationFrame优化时序控制，避免阻塞UI
  //   const sendCommandsSequentially = (commandIndex: number) => {
  //     if (commandIndex >= commands.length) {
  //       return;
  //     }

  //     const command = commands[commandIndex];

  //     // 使用requestAnimationFrame确保在下一帧执行，不阻塞UI
  //     requestAnimationFrame(() => {
  //       setDebugLog({
  //         time: new Date().toISOString(),
  //         msg: `sendCmdDispatch: ${command}`,
  //       });
  //       sendCmdDispatch(command);

  //       // 继续发送下一个指令，使用微任务队列避免阻塞
  //       if (commandIndex + 1 < commands.length) {
  //         // 使用Promise.resolve().then()创建微任务，比setTimeout更高效
  //         Promise.resolve().then(() => {
  //           sendCommandsSequentially(commandIndex + 1);
  //         });
  //       }
  //     });
  //   };

  //   // 开始发送指令序列
  //   sendCommandsSequentially(0);
  // }, [setRobotStatus, setDebugLog]);

  return (
    <View className="mb-10 mt-4 w-full gap-y-5">
      <SegmentedButtons
        value={robotStatus.currentMode}
        density="medium"
        onValueChange={(value) => {
          setRobotStatus({
            currentMode: value as ROBOT_CURRENT_MODE,
          });
          sendCmd(value as ROBOT_CURRENT_MODE);
          if (value !== ROBOT_CURRENT_MODE.AUTO) {
            setRobotStatus({
              currentBindingMode: '',
            });
          }
        }}
        buttons={[
          {
            value: ROBOT_CURRENT_MODE.LOCKED,
            label: t('common.lock'),
            icon: 'lock',
            checkedColor: '#ffffff',
            labelStyle: { fontSize: 11 },
            style: {
              backgroundColor:
                robotStatus.currentMode === ROBOT_CURRENT_MODE.LOCKED ? '#012641' : 'transparent',
            },
          },
          {
            value: ROBOT_CURRENT_MODE.MANUAL,
            label: t('common.manual'),
            icon: 'camera-control',
            checkedColor: '#ffffff',
            labelStyle: { fontSize: 11 },
            style: {
              backgroundColor:
                robotStatus.currentMode === ROBOT_CURRENT_MODE.MANUAL ? '#012641' : 'transparent',
            },
          },
          {
            value: ROBOT_CURRENT_MODE.AUTO,
            label: t('common.auto'),
            icon: 'robot-mower-outline',
            checkedColor: '#ffffff',
            labelStyle: { fontSize: 11 },
            style: {
              backgroundColor:
                robotStatus.currentMode === ROBOT_CURRENT_MODE.AUTO ? '#012641' : 'transparent',
            },
          },
        ]}
      />
      {robotStatus.currentMode === ROBOT_CURRENT_MODE.AUTO ? (
        <SegmentedButtons
          value={robotStatus.currentBindingMode || ''}
          density="medium"
          onValueChange={(value) => {
            setRobotStatus({
              currentBindingMode: value as ROBOT_WORK_MODE,
            });
            if (value === ROBOT_WORK_MODE.WITHOUT_BINDING) {
              sendCmdDispatch(Command.noLashed);
            } else if (value === ROBOT_WORK_MODE.FULL_BINDING) {
              sendCmdWithRepeat(
                () => {
                  sendCmdDispatch(Command.allLashed);
                },
                2,
                10
              );
            } else if (value === ROBOT_WORK_MODE.SKIP_BINDING) {
              sendCmdDispatch(Command.jumpLashed);
              console.log('进入跳绑模式');
            }
          }}
          buttons={[
            {
              value: ROBOT_WORK_MODE.WITHOUT_BINDING,
              label: t('common.noLashed'),
              icon: 'not-equal-variant',
              checkedColor: '#ffffff',
              labelStyle: { fontSize: 11 },
              style: {
                backgroundColor:
                  robotStatus.currentBindingMode === ROBOT_WORK_MODE.WITHOUT_BINDING
                    ? '#012641'
                    : 'transparent',
              },
            },
            {
              value: ROBOT_WORK_MODE.FULL_BINDING,
              label: t('common.fullLashed'),
              icon: 'transit-connection',
              checkedColor: '#ffffff',
              labelStyle: { fontSize: 11 },
              style: {
                backgroundColor:
                  robotStatus.currentBindingMode === ROBOT_WORK_MODE.FULL_BINDING
                    ? '#012641'
                    : 'transparent',
              },
            },
            {
              value: ROBOT_WORK_MODE.SKIP_BINDING,
              label: t('common.skipLashed'),
              icon: 'transit-skip',
              checkedColor: '#ffffff',
              labelStyle: { fontSize: 11 },
              style: {
                backgroundColor:
                  robotStatus.currentBindingMode === ROBOT_WORK_MODE.SKIP_BINDING
                    ? '#012641'
                    : 'transparent',
              },
            },
          ]}
        />
      ) : null}
    </View>
  );
};
