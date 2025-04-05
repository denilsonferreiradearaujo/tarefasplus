import { GetServerSideProps } from "next"
import { ChangeEvent, FormEvent, useEffect, useState } from "react"
import Head from "next/head"
import styles from "./styles.module.css"
import Link from "next/link"

import { getSession } from "next-auth/react"
import { Textarea } from "@/src/components/textarea"

import { GoTrash } from "react-icons/go";
import { IoMdShare } from "react-icons/io";

import { ToastContainer, toast } from 'react-toastify';

import { db } from "@/src/services/firebaseConnection";

import { addDoc, collection, query, orderBy, where, onSnapshot, doc, deleteDoc } from "firebase/firestore"

interface HomeProps {
    user: {
        email: string,
    }
}

interface TaskProps {
    id: string,
    created: Date,
    public: boolean,
    tarefa: string,
    user: string,
}

export default function Dashboard({ user }: HomeProps) {

    const [input, setInput] = useState("")
    const [publicTask, setPublicTask] = useState(false)
    const [tasks, setTasks] = useState<TaskProps[]>([])

    useEffect(() => {
        async function loadTarefas() {
            const tarefasRef = collection(db, "tarefas")
            const q = query(
                tarefasRef,
                orderBy("created", "desc"),
                where("user", "==", user?.email)
            );

            onSnapshot(q, (snapshot) => {
                // console.log(snapshot)
                let lista = [] as TaskProps[];

                snapshot.forEach((doc) => {
                    lista.push({
                        id: doc.id,
                        tarefa: doc.data().tarefa,
                        created: doc.data().created,
                        user: doc.data().user,
                        public: doc.data().public,
                    })
                })

                // console.log(lista)
                setTasks(lista)
            });
        }

        loadTarefas();
    }, [user?.email])

    function handleChangeChecked(event: ChangeEvent<HTMLInputElement>) {
        // console.log(event.target.checked)
        setPublicTask(event.target.checked)
    }

    async function handleRegisterTask(event: FormEvent) {
        event.preventDefault();

        if (input === "") {
            // alert("Informa a sua tarefa")
            toast.warning("Informe sua tarefa")
            return
        };

        try {
            await addDoc(collection(db, "tarefas"), {
                tarefa: input,
                created: new Date(),
                user: user?.email,
                public: publicTask,
            });

            setInput("")
            setPublicTask(false)

            toast.success("Tarefa cadastrada com sucesso!")
        } catch (err) {
            console.log(err);
        }
    }

    async function handleShare(id: string){
        await navigator.clipboard.writeText(
            `${process.env.NEXT_PUBLIC_URL}/task/${id}`
        );

        toast.success("Link copiado com sucesso!")
    }

    async function handleDeleteTask(id: string) {
        const docRef = doc(db, "tarefas", id)
        await deleteDoc(docRef)

        toast.success("Deletado com sucesso!")
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Meu Painel</title>
            </Head>

            <main className={styles.main}>

                <section className={styles.content}>
                    <div className={styles.contentForm}>
                        <h1>Qual a sua tarefa?</h1>
                        <form onSubmit={handleRegisterTask}>
                            <Textarea
                                placeholder="Digite qual a sua tarefa"
                                value={input}
                                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)}
                            />
                            <div className={styles.checkboxArea}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={publicTask}
                                    onChange={handleChangeChecked}
                                />
                                <label>Deixar tarefa pública?</label>
                            </div>
                            <button type="submit" className={styles.button}>
                                Registrar
                            </button>
                        </form>
                    </div>
                </section>

                <section className={styles.taskContainer}>
                    <h1 className={styles.title}>Minhas Tarefas</h1>

                    {tasks.map((item) => (
                        <article key={item.id} className={styles.task}>

                            {item.public && (
                                <div className={styles.tagContainer}>
                                    <label className={styles.tag}>PÚBLICO</label>
                                    <button className={styles.shareButton} onClick={() => handleShare(item.id)}>
                                        <IoMdShare size={24} color="#3183ff" />
                                    </button>
                                </div>
                            )}

                            <div className={styles.tasksContent}>
                                {item.public  ? (
                                    <Link href={`/task/${item.id}`}>
                                        <p>{item.tarefa}</p>
                                    </Link>
                                ): (
                                    <p>{item.tarefa}</p>
                                )}
                                
                                <button className={styles.trashButton} onClick={() => handleDeleteTask(item.id)}>
                                    <GoTrash size={24} color="#EA3140" />
                                </button>
                            </div>
                        </article>
                    ))}

                </section>

            </main>

            <ToastContainer />
        </div>

    )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const session = await getSession({ req })

    if (!session?.user) {
        return {
            redirect: {
                destination: "/",
                permanent: false
            }
        }

    }

    return {
        props: {
            user: {
                email: session?.user?.email,
            }
        }
    }
}