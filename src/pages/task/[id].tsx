import { ChangeEvent, FormEvent, use, useState } from "react"
import { useSession } from "next-auth/react"

import { GetServerSideProps } from "next"
import styles from "./styles.module.css"
import Head from "next/head"

import { db } from "@/src/services/firebaseConnection"
import { addDoc, collection, query, where, getDoc, getDocs, doc, deleteDoc } from "firebase/firestore"

import { Textarea } from "@/src/components/textarea"
import { toast, ToastContainer } from "react-toastify"

import { GoTrash } from "react-icons/go";

interface TaskProps {
    item: {
        tarefa: string;
        public: boolean;
        created: string;
        user: string;
        taskId: string;
    }
    allComments: CommentProps[]
}

interface CommentProps {
    id: string;
    comment: string;
    taskId: string;
    user: string,
    name: string,

}

export default function Task({ item, allComments }: TaskProps) {
    const { data: session } = useSession();
    const [input, setInput] = useState("");
    const [comments, setComments] = useState<CommentProps[]>(allComments || "")


    async function handleComments(event: FormEvent) {
        event.preventDefault();

        if (input === "") {
            // alert("Informa a sua tarefa")
            toast.warning("Informe seu comentário")
            return
        };

        try {
            const docRef = await addDoc(collection(db, "comments"), {
                comment: input,
                created: new Date(),
                user: session?.user?.email,
                name: session?.user?.name,
                taskId: item?.taskId,
            });

            const data = {
                id: docRef.id,
                comment: input,
                user: session?.user?.email ?? "",
                name: session?.user?.name ?? "",
                taskId: item?.taskId,

            }

            setComments((oldItens) => [...oldItens, data]);

            setInput("")

            toast.success("Comentário cadastrado com sucesso!")

        } catch (err) {
            console.log(err)
        }

    }

    async function handleDeleteComment(id: string) {
        try {
            const docRef = doc(db, "comments", id)
            await deleteDoc(docRef)
            toast.success("Deletado com sucesso!")

            const deletComment = comments.filter((item) => item.id !== id)

            setComments(deletComment)

        } catch (err) {
            console.log(err)
        }

    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Detalhes da Tarefas</title>
            </Head>

            <main className={styles.main}>
                <h1>Tarefa</h1>
                <article className={styles.task}>
                    <p>{item.tarefa}</p>
                </article>

            </main>

            <section className={styles.commentsContainer}>
                <h2>Deixar comentário</h2>

                <form onSubmit={handleComments}>
                    <Textarea
                        placeholder="Digite seu comentário..."
                        value={input}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)}
                    />
                    <button className={styles.button} disabled={!session?.user}>
                        Enviar comentário
                    </button>
                </form>
            </section>

            <section className={styles.commentsContainer}>
                <h2>Todos comentários</h2>
                {comments.length === 0 && (
                    <span>Não há nenhum comentário...</span>
                )}

                {comments.map((item) => (
                    <article key={item.id} className={styles.comment}>
                        <div className={styles.headComment}>
                            <label className={styles.commentsLabel}>{item.name}</label>
                            {item.user === session?.user?.email && (
                                <button className={styles.buttonTrash} onClick={() => handleDeleteComment(item.id)}>
                                    <GoTrash size={18} color="#ea3140" />
                                </button>
                            )}
                        </div>
                        <p>{item.comment}</p>
                    </article>
                ))}

            </section>

            <ToastContainer />
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    const id = params?.id as string
    const docRef = doc(db, "tarefas", id)

    const q = query(collection(db, "comments"), where("taskId", "==", id))
    const snapshotComments = await getDocs(q)

    let allComments: CommentProps[] = [];

    snapshotComments.forEach((doc) => {
        allComments.push({
            id: doc.id,
            comment: doc.data().comment,
            user: doc.data().user,
            name: doc.data().name,
            taskId: doc.data().taskId,
        })
    })

    // console.log(allComments)

    const snapshot = await getDoc(docRef);

    if (snapshot.data() === undefined) {
        return {
            redirect: {
                destination: "/",
                permanent: false,
            }
        }
    }

    if (!snapshot.data()?.public) {
        return {
            redirect: {
                destination: "/",
                permanent: false,
            }
        }
    }

    const miliseconds = snapshot.data()?.created?.seconds * 1000;

    const task = {
        tarefa: snapshot.data()?.tarefa,
        public: snapshot.data()?.public,
        created: new Date(miliseconds).toLocaleDateString(),
        user: snapshot.data()?.user,
        taskId: id,
    }

    return {
        props: {
            item: task,
            allComments: allComments,
        }
    }
}