import cn from 'classnames';
import { motion } from 'framer-motion';
import {
  Upload,
  Globe,
  X,
  ArrowDown,
  Code,
  Moon,
  Share,
  Sun,
  MessageCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  FC,
  JSXElementConstructor,
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'react-hot-toast';
import colors from 'tailwindcss/colors';

import { addSource, deleteSource } from '@/lib/api';
import { SAMPLE_REPO_URL } from '@/lib/constants';
import { useConfigContext } from '@/lib/context/config';
import { useTrainingContext } from '@/lib/context/training';
import emitter, { EVENT_OPEN_CHAT } from '@/lib/events';
import useFiles from '@/lib/hooks/use-files';
import useProject from '@/lib/hooks/use-project';
import useSources from '@/lib/hooks/use-sources';
import {
  getIconForSource,
  getLabelForSource,
  getNameFromPath,
  removeFileExtension,
  showConfetti,
} from '@/lib/utils';
import { SourceType } from '@/types/types';

import StatusMessage from './StatusMessage';
import GetCode from '../dialogs/code/GetCode';
import FilesAddSourceDialog from '../dialogs/sources/Files';
import MotifAddSourceDialog from '../dialogs/sources/Motif';
import WebsiteAddSourceDialog from '../dialogs/sources/Website';
import { ModelConfigurator } from '../files/ModelConfigurator';
import { Playground } from '../files/Playground';
import { UIConfigurator } from '../files/UIConfigurator';
import { GitHubIcon } from '../icons/GitHub';
import { MotifIcon } from '../icons/Motif';
import { SpinnerIcon } from '../icons/Spinner';
import Button from '../ui/Button';
import { PulseDot } from '../ui/PulseDot';

const GitHubAddSourceDialog = dynamic(
  () => import('@/components/dialogs/sources/GitHub'),
  {
    loading: () => <p className="p-4 text-sm text-neutral-500">Loading...</p>,
  },
);

export const Row = ({
  label,
  className,
  children,
}: {
  label: string | ReactNode;
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <div className={cn(className, 'grid grid-cols-2 items-center gap-4')}>
      <div className="truncate py-1 text-sm text-neutral-300">{label}</div>
      {children && <div className="flex w-full justify-end">{children}</div>}
    </div>
  );
};

type ConnectButtonProps = {
  label: string;
  Icon: JSXElementConstructor<any>;
  sample?: boolean;
  onClick?: () => void;
};

const ConnectButton = forwardRef<HTMLButtonElement, ConnectButtonProps>(
  ({ label, Icon, onClick, ...props }, ref) => {
    return (
      <button
        {...props}
        onClick={onClick}
        ref={ref}
        className="button-ring relative w-full rounded-lg border border-neutral-900 transition hover:bg-neutral-1000"
      >
        <div className="flex flex-row items-center gap-4 p-4 sm:p-3">
          <Icon className="h-4 w-4 flex-none text-neutral-300" />
          <span className="flex-grow truncate text-left text-sm font-medium leading-tight text-neutral-300">
            {label}
          </span>
        </div>
      </button>
    );
  },
);

export const Lines = ({
  top,
  width,
  height,
  topLeft,
}: {
  top: number;
  width: number;
  height: number;
  topLeft: boolean;
}) => {
  let path;
  if (topLeft) {
    path = `M1 ${top}h${Math.round(width * 0.7)}a4 4 0 014 4v${
      height - 10
    }a4 4 0 004 4h${Math.round(width * 0.3)}`;
  } else {
    path = `M1 ${top + height}h${Math.round(width * 0.7)}a4 4 0 004-4v${
      -height - 2
    }a4 4 0 014-4h${Math.round(width * 0.3)}`;
  }

  // const path1 = `M0 0h${width}v${height}H0z`;

  // console.log('topLeft', JSON.stringify(topLeft, null, 2));
  return (
    <svg viewBox={`0 0 ${width} ${4 * height}`} fill="none">
      <path d={path} stroke="#000000" strokeOpacity="0.2" />
      <path
        d={path}
        stroke="url(#pulse)"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <defs>
        <motion.linearGradient
          animate={
            topLeft
              ? {
                  x1: [0, -2 * width],
                  y1: [3 * height, -height],
                  x2: [0, -width],
                  y2: [4 * height, 0],
                }
              : {
                  x1: [0, -2 * width],
                  y1: [-2 * height, 2 * height],
                  x2: [0, -width],
                  y2: [-3 * height, height],
                }
          }
          transition={{
            duration: 4,
            repeat: Infinity,
          }}
          id="pulse"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={colors.fuchsia['500']} stopOpacity="0" />
          <stop stopColor={colors.fuchsia['500']} />
          <stop offset="1" stopColor={colors.red['500']} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
};

ConnectButton.displayName = 'ConnectButton';

type PlaygroundDashboardProps = {
  isOnboarding?: boolean;
};

const PlaygroundDashboard: FC<PlaygroundDashboardProps> = ({
  isOnboarding,
}) => {
  const { project } = useProject();
  const { files, mutate: mutateFiles, loading: loadingFiles } = useFiles();
  const {
    sources,
    mutate: mutateSources,
    loading: loadingSources,
  } = useSources();
  const { state: trainingState, trainAllSources } = useTrainingContext();
  const {
    theme,
    colors,
    isDark,
    includeBranding,
    modelConfig,
    setDark,
    placeholder,
    iDontKnowMessage,
    referencesHeading,
    loadingHeading,
  } = useConfigContext();
  const [pathDivSize, setPathDivSize] = useState({ width: 0, height: 0 });
  const pathDivRef = useRef<HTMLDivElement>(null);

  const startTraining = useCallback(async () => {
    await trainAllSources(
      () => {
        // Do nothing
      },
      (errorMessage: string) => {
        toast.error(errorMessage);
      },
    );
    mutateFiles();
    if (isOnboarding) {
      showConfetti();
      toast.success(
        'Done processing sources. You can now ask questions to your content!',
      );
    } else {
      toast.success('Done processing sources.');
    }
  }, [trainAllSources, mutateFiles, isOnboarding]);

  const _addSource = useCallback(
    async (sourceType: SourceType, data: any) => {
      if (!project?.id) {
        return;
      }

      try {
        const newSource = await addSource(project.id, sourceType, data);
        await mutateSources([...sources, newSource]);
        // setTimeout(async () => {
        //   await startTraining();
        // }, 1000);
      } catch (e) {
        console.error(e);
        toast.error(`${e}`);
      }
    },
    [project?.id, mutateSources, sources],
  );

  const hasConnectedSources = sources && sources.length > 0;
  const isTrained = files && files.length > 0;
  const isLoading = loadingSources || loadingFiles;
  const isTraining = trainingState.state !== 'idle';
  const isShowingOverlay =
    isTraining || (!isLoading && (!hasConnectedSources || !isTrained));

  useEffect(() => {
    if (!isShowingOverlay) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (!pathDivRef.current) {
        return;
      }
      const rect = pathDivRef.current?.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      console.log('width', width, height);
      setPathDivSize({
        width,
        height,
      });
    });

    pathDivRef.current && observer.observe(pathDivRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isShowingOverlay]);

  return (
    <div className="absolute inset-0 grid grid-cols-1 sm:grid-cols-4">
      <div className="relative h-full">
        <div className="absolute inset-x-0 top-0 bottom-[var(--playground-navbar-height)] overflow-y-auto p-6">
          <h1 className="relative truncate whitespace-nowrap text-xl font-bold text-neutral-300">
            Connect source{' '}
            {!isLoading && (!sources || sources.length === 0) && (
              <PulseDot className="translate-x-[-4px] translate-y-[-8px] transform" />
            )}
          </h1>
          <p className="mt-2 text-sm font-normal text-neutral-500">
            Missing a source?{' '}
            <span
              className="subtle-underline cursor-pointer"
              onClick={() => {
                emitter.emit(EVENT_OPEN_CHAT);
              }}
            >
              Let us know
            </span>
            .
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-1 sm:gap-2">
            <GitHubAddSourceDialog onDidAddSource={startTraining}>
              <ConnectButton label="GitHub repo" Icon={GitHubIcon} />
            </GitHubAddSourceDialog>
            <WebsiteAddSourceDialog
              onDidAddSource={startTraining}
              openPricingAsDialog={isOnboarding}
            >
              <ConnectButton label="Website" Icon={Globe} />
            </WebsiteAddSourceDialog>
            <MotifAddSourceDialog onDidAddSource={startTraining}>
              <ConnectButton label="Motif project" Icon={MotifIcon} />
            </MotifAddSourceDialog>
            <FilesAddSourceDialog onDidAddSource={startTraining}>
              <ConnectButton label="Upload files" Icon={Upload} />
            </FilesAddSourceDialog>
          </div>
          <p className="mt-6 text-sm text-neutral-500">
            Or select a sample data source:
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-1">
            <ConnectButton
              label="Markprompt docs"
              Icon={GitHubIcon}
              onClick={async () => {
                await _addSource('github', { url: SAMPLE_REPO_URL });
              }}
            />
          </div>
          {sources?.length > 0 && (
            <>
              <h2 className="mt-8 text-sm font-semibold text-neutral-300">
                Connected sources
              </h2>
              <div className="mt-4 flex flex-col gap-2">
                {sources.map((source, i) => {
                  const Icon = getIconForSource(source.type);
                  return (
                    <div
                      key={`source-icon-${i}`}
                      className="flex flex-row items-center gap-2 rounded-md bg-sky-900/20 py-2 pl-3 pr-2 outline-none"
                    >
                      <Icon className="h-4 w-4 flex-none text-sky-400" />
                      <p className="flex-grow overflow-hidden truncate text-xs text-sky-400">
                        {getLabelForSource(source)}
                      </p>
                      <button
                        className="button-ring rounded-md p-1 outline-none"
                        onClick={async () => {
                          if (!project?.id) {
                            return;
                          }
                          await deleteSource(project.id, source.id);
                          await mutateSources();
                          await mutateFiles();
                          toast.success('The source has been removed.');
                        }}
                      >
                        <X className="h-3 w-3 text-sky-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-20 flex transform flex-col justify-center gap-2 border-t border-neutral-900 bg-neutral-1100 px-6 py-3 transition duration-300',
            {
              'translate-y-0 opacity-100': sources.length > 0,
              'translate-y-[20px] opacity-0': sources.length === 0,
            },
          )}
        >
          {trainingState.state !== 'idle' && (
            <StatusMessage
              trainingState={trainingState}
              numFiles={files?.length || 0}
              numSelected={0}
            />
          )}
          <Button
            className="w-full"
            variant={isTrained ? 'plain' : 'glow'}
            loading={trainingState.state !== 'idle'}
            onClick={startTraining}
          >
            Process sources
          </Button>
        </div>
      </div>
      <div className="relative col-span-2">
        <div
          className={cn(
            'absolute inset-0 z-30 flex flex-row items-center bg-black/80 shadow-xl transition duration-300',
            {
              'opacity-100': isShowingOverlay,
              'pointer-events-none opacity-0': !isShowingOverlay,
            },
          )}
        >
          <div className="relative h-full w-[33%] flex-none">
            <div
              ref={pathDivRef}
              className={cn(
                'absolute top-[20px] bottom-[20px] left-0 w-full transition duration-500',
              )}
            >
              {!hasConnectedSources && !isTraining && (
                <div className="absolute inset-0 transition duration-500">
                  <Lines
                    top={20}
                    topLeft
                    width={pathDivSize.width}
                    height={pathDivSize.height / 2 - 50}
                  />
                </div>
              )}
              {hasConnectedSources && !isTraining && (
                <div className="absolute inset-0 transition duration-500">
                  <Lines
                    topLeft={false}
                    top={pathDivSize.height / 2 + 40}
                    width={pathDivSize.width}
                    height={pathDivSize.height / 2 - 52}
                  />
                </div>
              )}
            </div>
          </div>
          {isShowingOverlay && (
            <div
              className={cn(
                'transfrom flex w-min flex-row items-center gap-2 whitespace-nowrap rounded-full border border-neutral-900 bg-black/50 py-3 px-5 text-sm text-white backdrop-blur transition duration-500',
                {
                  'translate-y-[-30px]': !hasConnectedSources,
                  'translate-y-[30px]': hasConnectedSources,
                },
              )}
            >
              {trainingState.state !== 'idle' && (
                <SpinnerIcon className="ml-1 h-4 w-4 animate-spin" />
              )}
              {!hasConnectedSources ? (
                <>
                  {isOnboarding
                    ? 'Start by connecting one or more sources'
                    : 'Connect one or more sources'}
                </>
              ) : trainingState.state !== 'idle' ? (
                <>Processing sources</>
              ) : (
                <>Great! Now hit &apos;Process sources&apos;</>
              )}
            </div>
          )}
        </div>
        <div
          className={cn('h-full w-full overflow-hidden', {
            'pointer-events-none': !hasConnectedSources || !isTrained,
          })}
        >
          {project && (
            <div
              className={cn(
                'grid-background h-full border-l border-r border-neutral-900',
                {
                  'grid-background-dark bg-neutral-900': isDark,
                  'grid-background-light bg-neutral-100': !isDark,
                },
              )}
            >
              <div className="relative flex h-full flex-col gap-4">
                {/* <div className="z-10 flex h-[var(--playground-navbar-height)] flex-none flex-row items-center gap-2 border-b border-neutral-900 bg-neutral-1100 px-4 shadow-lg">
                  <Button
                    disabled={!isTrained}
                    buttonSize="sm"
                    variant="plain"
                    Icon={Share}
                  >
                    Share
                  </Button>
                  <GetCode isOnboarding={!isOnboarding}>
                    <Button
                      disabled={!isTrained}
                      buttonSize="sm"
                      variant="plain"
                      Icon={Code}
                    >
                      Get code
                    </Button>
                  </GetCode>
                </div> */}
                <div
                  className="pointer-events-none absolute inset-0 z-0"
                  style={{
                    backgroundColor: isDark
                      ? theme.colors.dark.overlay
                      : theme.colors.light.overlay,
                  }}
                />
                <div className="absolute inset-x-0 top-4 bottom-0 z-10 flex flex-col gap-4 px-16 py-8">
                  <Playground
                    projectKey={project.private_dev_api_key}
                    iDontKnowMessage={iDontKnowMessage}
                    theme={theme}
                    placeholder={placeholder}
                    isDark={isDark}
                    modelConfig={modelConfig}
                    referencesHeading={referencesHeading}
                    loadingHeading={loadingHeading}
                    includeBranding={includeBranding}
                    getReferenceInfo={(path: string) => {
                      const file = files?.find((f) => f.path === path);
                      if (file) {
                        let name = path;
                        const metaTitle = (file.meta as any).title;
                        if (metaTitle) {
                          name = metaTitle;
                        } else {
                          name = removeFileExtension(getNameFromPath(path));
                        }

                        return {
                          name,
                          href: path,
                        };
                      }
                    }}
                  />
                  <div className="flex flex-none flex-row justify-end">
                    <div
                      className="rounded-full border p-3"
                      style={{
                        backgroundColor: colors.primary,
                        borderColor: colors.border,
                      }}
                    >
                      <MessageCircle
                        className="h-5 w-5"
                        style={{
                          color: colors.primaryForeground,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        className={cn('relative h-full transition', {
          'pointer-events-none opacity-30': !files || files.length === 0,
        })}
      >
        <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col overflow-y-auto pb-20">
          <div className="sticky inset-x-0 top-0 z-10 grid grid-cols-2 items-center justify-end gap-4 border-b border-neutral-900 bg-neutral-1100 py-4 px-6 shadow-lg">
            <Button
              disabled={!isTrained}
              buttonSize="sm"
              variant="plain"
              Icon={Share}
            >
              Share
            </Button>
            <GetCode isOnboarding={!isOnboarding}>
              <Button
                disabled={!isTrained}
                buttonSize="sm"
                variant="plain"
                Icon={Code}
              >
                Get code
              </Button>
            </GetCode>
          </div>
          <div className="px-6 pt-4">
            <h2 className="mb-4 text-lg font-bold">Design</h2>
            <UIConfigurator />
            <h2 className="mb-4 mt-12 text-lg font-bold">Model configurator</h2>
            <ModelConfigurator />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundDashboard;
